import os
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"

import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, optimizers

class PPOAgent:
    def __init__(self,
                 input_dim,
                 action_dim,
                 actor_lr=1e-5,
                 critic_lr=1e-5,
                 gamma=0.95,
                 epsilon=0.25,
                 lambda_gae=0.97,
                 c1=1.0,
                 c2=0.05,
                 min_std=0.1,  # Minimum standard deviation
                 max_std=2.0):  # Maximum standard deviation
        
        self.input_dim = input_dim
        self.action_dim = action_dim
        self.actor_lr = actor_lr
        self.critic_lr = critic_lr
        self.gamma = gamma
        self.epsilon = epsilon
        self.lambda_gae = lambda_gae
        self.c1 = c1
        self.c2 = c2
        self.min_std = min_std
        self.max_std = max_std

        # Initialize models
        self.actor_model = None
        self.critic_model = None
        self.build_models()

    def build_models(self):
        # Actor network
        inputs = layers.Input(shape=(self.input_dim,))
        x = layers.Dense(128, activation='relu', kernel_initializer='he_normal',
                         kernel_regularizer=tf.keras.regularizers.l2(1e-4))(inputs)
        x = layers.BatchNormalization()(x)  # Stabilize inputs
        x = layers.Dense(128, activation='relu', kernel_initializer='he_normal',
                         kernel_regularizer=tf.keras.regularizers.l2(1e-4))(x)
        x = layers.Dropout(0.2)(x)  # Add dropout for regularization
        x = layers.Dense(64, activation='relu', kernel_initializer='he_normal',
                         kernel_regularizer=tf.keras.regularizers.l2(1e-4))(x)
        mu = layers.Dense(self.action_dim, activation='tanh')(x)
    
        log_std = layers.Dense(
            self.action_dim,
            activation='linear',
            kernel_initializer='zeros',
            bias_initializer='zeros',  # Avoid large initial values
            kernel_constraint=tf.keras.constraints.MinMaxNorm(-2.0, 2.0)
        )(x)
    
        self.actor_model = tf.keras.Model(inputs=inputs, outputs=[mu, log_std])
        self.actor_optimizer = optimizers.Adam(learning_rate=self.actor_lr)

        # Critic network
        inputs = layers.Input(shape=(self.input_dim,))
        x = layers.Dense(128, activation='relu', kernel_initializer='he_normal',
                         kernel_regularizer=tf.keras.regularizers.l2(1e-4))(inputs)
        x = layers.BatchNormalization()(x)
        x = layers.Dropout(0.2)(x)
        x = layers.Dense(128, activation='relu', kernel_initializer='he_normal',
                         kernel_regularizer=tf.keras.regularizers.l2(1e-4))(x)
        x = layers.Dropout(0.2)(x)
        x = layers.Dense(64, activation='relu', kernel_initializer='he_normal',
                         kernel_regularizer=tf.keras.regularizers.l2(1e-4))(x)
        value = layers.Dense(1)(x)
    
        self.critic_model = tf.keras.Model(inputs=inputs, outputs=value)
        self.critic_optimizer = optimizers.Adam(learning_rate=self.critic_lr) 

        
    @tf.function
    def get_action_and_value(self, state):
        state = tf.cast(state, tf.float32)
        mu, log_std = self.actor_model(state)
        std = tf.exp(log_std)
        
        # Clip standard deviation
        std = tf.clip_by_value(std, self.min_std, self.max_std)
        
        eps = tf.random.normal(shape=mu.shape, dtype=tf.float32)
        action = mu + eps * std
        
        log_prob = -0.5 * tf.cast(
            tf.square((action - mu) / (std + 1e-8))
            + 2 * log_std
            + tf.math.log(2 * np.pi),
            tf.float32
        )
        log_prob = tf.reduce_sum(log_prob, axis=-1)
        
        value = self.critic_model(state)
        
        return action, log_prob, value

    @tf.function
    def train_step(self, states, actions, old_log_probs, advantages, returns):
        states = tf.cast(states, tf.float32)
        actions = tf.cast(actions, tf.float32)
        old_log_probs = tf.cast(old_log_probs, tf.float32)
        advantages = tf.cast(advantages, tf.float32)
        returns = tf.cast(returns, tf.float32)

        with tf.GradientTape() as tape:
            # Actor loss
            mu, log_std = self.actor_model(states)
            std = tf.exp(log_std)
            std = tf.clip_by_value(std, self.min_std, self.max_std)
            log_probs = -0.5 * tf.square((actions - mu) / (std + 1e-8)) - log_std - tf.math.log(2 * np.pi + 1e-8)
            log_probs = tf.reduce_sum(log_probs, axis=-1)
            ratio = tf.exp(log_probs - old_log_probs)
            clip_ratio = tf.clip_by_value(ratio, 1 - self.epsilon, 1 + self.epsilon)
            policy_loss = -tf.reduce_mean(tf.minimum(ratio * advantages, clip_ratio * advantages))

            # Critic loss
            values = self.critic_model(states)
            value_loss = tf.reduce_mean(tf.square(returns - values))

            # Entropy
            entropy = tf.reduce_mean(0.5 * (tf.math.log(2 * np.pi * tf.square(std)) + 1))
            total_loss = policy_loss + self.c1 * value_loss - self.c2 * entropy

        # Compute gradients
        gradients = tape.gradient(total_loss, self.actor_model.trainable_variables + self.critic_model.trainable_variables)

        # Compute gradient norm
        grad_norm = tf.linalg.global_norm(gradients)
        # tf.print("Gradient norm:", grad_norm)

        # # Debug individual gradients
        # for i, grad in enumerate(gradients):
        #     tf.print(f"Gradient {i} norm:", tf.linalg.global_norm([grad]))

        # Skip update if gradients are NaN or too large
        if tf.math.is_nan(grad_norm) or grad_norm > 1e4:
            tf.print("Exploding gradients detected! Skipping this step.")
            return policy_loss, value_loss, entropy

        # Apply clipped gradients
        gradients, _ = tf.clip_by_global_norm(gradients, 1.0)
        self.actor_optimizer.apply_gradients(zip(gradients[:len(self.actor_model.trainable_variables)],
                                                 self.actor_model.trainable_variables))
        self.critic_optimizer.apply_gradients(zip(gradients[len(self.actor_model.trainable_variables):],
                                                  self.critic_model.trainable_variables))

        return policy_loss, value_loss, entropy


    def compute_advantages(self, rewards, values, dones, next_value):
        advantages = np.zeros_like(rewards, dtype=np.float32)
        gae = 0.0
        
        for t in reversed(range(len(rewards))):
            if t == len(rewards) - 1:
                next_val = next_value
            else:
                next_val = values[t + 1]
            
            mask = 1.0 - dones[t]
            delta = rewards[t] + self.gamma * next_val * mask - values[t]
            gae = delta + self.gamma * self.lambda_gae * mask * gae
            advantages[t] = gae
        
        returns = advantages + values
        
        # Normalize advantages
        advantages = (advantages - advantages.mean()) / (advantages.std() + 1e-8)
        
        return advantages.astype(np.float32), returns.astype(np.float32)