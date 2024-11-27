import os
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"

import numpy as np # type: ignore
import tensorflow as tf # type: ignore
from tensorflow.keras import layers, optimizers # type: ignore

class PPOAgent:
    def __init__(self,
                 input_dim,
                 action_dim,
                 actor_lr=1e-4,
                 critic_lr=1e-4,
                 gamma=0.99,
                 epsilon=0.1,
                 lambda_gae=0.95,
                 c1=2.0,
                 c2=0.001, 
                 min_std=0.1,  # Minimum standard deviation
                 max_std=0.5):  # Maximum standard deviation

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
        x = layers.Dense(128, activation='relu', kernel_initializer='he_normal')(inputs)
        x = layers.BatchNormalization()(x)
        x = layers.Dense(128, activation='relu', kernel_initializer='he_normal')(x)
        x = layers.Dropout(0.2)(x)
        x = layers.Dense(64, activation='relu', kernel_initializer='he_normal')(x)
        mu = layers.Dense(self.action_dim, activation='tanh')(x)

        # Properly constrain log_std
        log_std = layers.Dense(self.action_dim, activation='tanh')(x)
        log_std = log_std * 2  # Scale to range [-2, 2]

        self.actor_model = tf.keras.Model(inputs=inputs, outputs=[mu, log_std])
        self.actor_optimizer = optimizers.Adam(learning_rate=self.actor_lr)

        # Critic network
        critic_inputs = layers.Input(shape=(self.input_dim,))
        x = layers.Dense(128, activation='relu', kernel_initializer='he_normal')(critic_inputs)
        x = layers.BatchNormalization()(x)
        x = layers.Dropout(0.2)(x)
        x = layers.Dense(128, activation='relu', kernel_initializer='he_normal')(x)
        x = layers.Dropout(0.2)(x)
        x = layers.Dense(64, activation='relu', kernel_initializer='he_normal')(x)
        value = layers.Dense(1)(x)

        self.critic_model = tf.keras.Model(inputs=critic_inputs, outputs=value)
        self.critic_optimizer = optimizers.Adam(learning_rate=self.critic_lr)

    @tf.function
    def get_action_and_value(self, state):
        state = tf.cast(state, tf.float32)
        mu, log_std = self.actor_model(state)
        std = tf.exp(log_std)

        # Sample action using reparameterization trick
        eps = tf.random.normal(shape=mu.shape, dtype=tf.float32)
        action = mu + eps * std

        # Calculate log probability
        log_prob = -0.5 * (
            ((action - mu) / (std + 1e-8)) ** 2 +
            2 * tf.math.log(std + 1e-8) +
            tf.math.log(2 * np.pi)
        )
        log_prob = tf.reduce_sum(log_prob, axis=-1)

        # Get state value
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
            # Actor forward pass
            mu, log_std = self.actor_model(states)
            std = tf.exp(log_std)

            # Calculate new log probabilities
            log_probs = -0.5 * (
                ((actions - mu) / (std + 1e-8)) ** 2 +
                2 * tf.math.log(std + 1e-8) +
                tf.math.log(2 * np.pi)
            )
            log_probs = tf.reduce_sum(log_probs, axis=-1)

            # Calculate ratios
            ratios = tf.exp(log_probs - old_log_probs)

            # Clipped surrogate objective
            clipped_ratios = tf.clip_by_value(ratios, 1 - self.epsilon, 1 + self.epsilon)
            policy_loss = -tf.reduce_mean(tf.minimum(ratios * advantages, clipped_ratios * advantages))

            # Critic loss
            values = self.critic_model(states)
            value_loss = tf.reduce_mean(tf.square(returns - values))

            # Entropy bonus
            entropy = tf.reduce_mean(0.5 * (tf.math.log(2 * np.pi * tf.square(std)) + 1))
            total_loss = policy_loss + self.c1 * value_loss - self.c2 * entropy

        # Compute gradients
        gradients = tape.gradient(total_loss, self.actor_model.trainable_variables + self.critic_model.trainable_variables)

        # Apply gradient clipping
        gradients, _ = tf.clip_by_global_norm(gradients, 0.5)

        # Replace NaNs or Infs in gradients with zeros
        for i, grad in enumerate(gradients):
            if tf.reduce_any(tf.math.is_nan(grad)) or tf.reduce_any(tf.math.is_inf(grad)):
                tf.print("NaN or Inf detected in gradients! Replacing with zeros.")
                gradients[i] = tf.where(tf.math.is_finite(grad), grad, tf.zeros_like(grad))

        # Apply gradients to the actor and critic networks
        self.actor_optimizer.apply_gradients(zip(
            gradients[:len(self.actor_model.trainable_variables)],
            self.actor_model.trainable_variables
        ))
        self.critic_optimizer.apply_gradients(zip(
            gradients[len(self.actor_model.trainable_variables):],
            self.critic_model.trainable_variables
        ))

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
