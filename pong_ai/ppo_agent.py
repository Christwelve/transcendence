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
                 gamma=0.995,
                 epsilon=0.05,
                 lambda_gae=0.95,
                 c1=2.0,
                 c2=0.05):

        self.input_dim = input_dim
        self.action_dim = action_dim  #[1, 0, -1]
        self.actor_lr = actor_lr
        self.critic_lr = critic_lr
        self.gamma = gamma
        self.epsilon = epsilon
        self.lambda_gae = lambda_gae
        self.c1 = c1
        self.c2 = c2

        # Initialize models
        self.build_models()

    def build_models(self):
        # Actor network
        inputs = layers.Input(shape=(self.input_dim,))
        x = layers.Dense(128, activation='relu', kernel_initializer='he_normal')(inputs)
        x = layers.BatchNormalization()(x)
        x = layers.Dense(128, activation='relu', kernel_initializer='he_normal')(x)
        x = layers.Dropout(0.2)(x)
        x = layers.Dense(64, activation='relu', kernel_initializer='he_normal')(x)
        logits = layers.Dense(self.action_dim)(x)

        self.actor_model = tf.keras.Model(inputs=inputs, outputs=logits)
        self.actor_optimizer = optimizers.Adam(learning_rate=self.actor_lr)

        # Critic network
        critic_inputs = layers.Input(shape=(self.input_dim,))
        x = layers.Dense(128, activation='relu', kernel_initializer='he_normal')(critic_inputs)
        x = layers.BatchNormalization()(x)
        x = layers.Dense(128, activation='relu', kernel_initializer='he_normal')(x)
        x = layers.Dropout(0.2)(x)
        x = layers.Dense(64, activation='relu', kernel_initializer='he_normal')(x)
        x = layers.Dropout(0.2)(x)
        value = layers.Dense(1)(x)

        self.critic_model = tf.keras.Model(inputs=critic_inputs, outputs=value)
        self.critic_optimizer = optimizers.Adam(learning_rate=self.critic_lr)

    @tf.function
    def get_action_and_value(self, state):
        state = tf.cast(state, tf.float32)
        logits = self.actor_model(state)
        action_probs = tf.nn.softmax(logits)

        # Sample action from categorical distribution
        action = tf.squeeze(tf.random.categorical(logits, num_samples=1), axis=-1)
        action = tf.cast(action, tf.int32)

        # Get log probability of the action
        log_prob = tf.nn.sparse_softmax_cross_entropy_with_logits(logits=logits, labels=action)

        # Get state value
        value = self.critic_model(state)

        return action, log_prob, value

    @tf.function
    def train_step(self, states, actions, old_log_probs, advantages, returns):
        states = tf.cast(states, tf.float32)
        actions = tf.cast(actions, tf.int32)
        old_log_probs = tf.cast(old_log_probs, tf.float32)
        advantages = tf.cast(advantages, tf.float32)
        returns = tf.cast(returns, tf.float32)

        with tf.GradientTape() as tape:
            # Actor forward pass
            logits = self.actor_model(states)
            action_probs = tf.nn.softmax(logits)
            new_log_probs = tf.nn.sparse_softmax_cross_entropy_with_logits(logits=logits, labels=actions)

            # Calculate ratios
            ratios = tf.exp(old_log_probs - new_log_probs)

            # Clipped surrogate objective
            clipped_ratios = tf.clip_by_value(ratios, 1 - self.epsilon, 1 + self.epsilon)
            surrogate1 = ratios * advantages
            surrogate2 = clipped_ratios * advantages
            policy_loss = -tf.reduce_mean(tf.minimum(surrogate1, surrogate2))

            # Critic loss
            values = tf.squeeze(self.critic_model(states), axis=-1)
            value_loss = tf.reduce_mean(tf.square(returns - values))

            # Entropy bonus
            entropy = -tf.reduce_mean(action_probs * tf.math.log(action_probs + 1e-8))
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
        actor_grads = gradients[:len(self.actor_model.trainable_variables)]
        critic_grads = gradients[len(self.actor_model.trainable_variables):]

        self.actor_optimizer.apply_gradients(zip(
            actor_grads,
            self.actor_model.trainable_variables
        ))
        self.critic_optimizer.apply_gradients(zip(
            critic_grads,
            self.critic_model.trainable_variables
        ))

        return policy_loss, value_loss, entropy

    def compute_advantages(self, rewards, values, dones, next_value, normalize_rewards=False):
        # Optionally normalize rewards
        if normalize_rewards:
            rewards = (rewards - np.mean(rewards)) / (np.std(rewards) + 1e-8)

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
        advantages = (advantages - np.mean(advantages)) / (np.std(advantages) + 1e-8)

        return advantages.astype(np.float32), returns.astype(np.float32)
