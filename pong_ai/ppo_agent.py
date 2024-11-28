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
                 epsilon=0.05,
                 lambda_gae=0.9,
                 c1=2.0,
                 c2=1.0):
        """
        Initialize PPO agent with hyperparameters and neural network models.

        Args:
            input_dim (int): Dimension of input state space.
            action_dim (int): Number of possible actions.
            actor_lr (float): Learning rate for the actor network.
            critic_lr (float): Learning rate for the critic network.
            gamma (float): Discount factor for rewards.
            epsilon (float): Clipping parameter for PPO.
            lambda_gae (float): GAE (Generalized Advantage Estimation) lambda.
            c1 (float): Coefficient for critic loss.
            c2 (float): Coefficient for entropy bonus.
        """
        self.input_dim = input_dim
        self.action_dim = action_dim
        self.actor_lr = actor_lr
        self.critic_lr = critic_lr
        self.gamma = gamma
        self.epsilon = epsilon
        self.lambda_gae = lambda_gae
        self.c1 = c1
        self.c2 = c2

        self.build_models()

    def build_models(self):
        """
        Define and compile actor and critic neural network models.
        """
        # Actor network
        inputs = layers.Input(shape=(self.input_dim,))
        x = layers.Dense(128, activation='relu', kernel_initializer='glorot_uniform')(inputs)
        x = layers.LayerNormalization()(x)
        x = layers.Dense(128, activation='relu', kernel_initializer='he_normal')(x)
        # x = layers.Dropout(0.2)(x)
        x = layers.Dense(64, activation='relu', kernel_initializer='he_normal')(x)
        logits = layers.Dense(self.action_dim)(x)

        self.actor_model = tf.keras.Model(inputs=inputs, outputs=logits)
        self.actor_optimizer = optimizers.Adam(learning_rate=self.actor_lr)

        # Critic network
        critic_inputs = layers.Input(shape=(self.input_dim,))
        x = layers.Dense(128, activation='relu', kernel_initializer='glorot_uniform')(critic_inputs)
        x = layers.LayerNormalization()(x)
        x = layers.Dense(128, activation='relu', kernel_initializer='he_normal')(x)
        # x = layers.Dropout(0.2)(x)
        x = layers.Dense(64, activation='relu', kernel_initializer='he_normal')(x)
        value = layers.Dense(1)(x)

        self.critic_model = tf.keras.Model(inputs=critic_inputs, outputs=value)
        self.critic_optimizer = optimizers.Adam(learning_rate=self.critic_lr)

    @tf.function
    def get_action_and_value(self, state):
        """
        Predict action and value for a given state.
        
        Args:
            state (tf.Tensor): Input state tensor.
        
        Returns:
            action (tf.Tensor): Sampled action.
            log_prob (tf.Tensor): Log probability of the sampled action.
            value (tf.Tensor): Predicted value of the state.
        """
        state = tf.cast(state, tf.float32)
        logits = self.actor_model(state)

        log_prob = tf.nn.log_softmax(logits)
        
        # Sample an action based on probabilities
        action = tf.squeeze(tf.random.categorical(logits, num_samples=1), axis=-1)
        action = tf.cast(action, tf.int32)

        # Log probability of the selected action
        log_prob = tf.reduce_sum(tf.one_hot(action, self.action_dim) * log_prob, axis=-1)

        # State value from critic
        value = self.critic_model(state)

        return action, log_prob, value

    @tf.function
    def train_step(self, states, actions, old_log_probs, advantages, returns):
        """
        Perform a single training step for the PPO agent.

        Args:
            states (tf.Tensor): Input states.
            actions (tf.Tensor): Taken actions.
            old_log_probs (tf.Tensor): Log probabilities of actions from previous policy.
            advantages (tf.Tensor): Computed advantages.
            returns (tf.Tensor): Computed discounted returns.

        Returns:
            policy_loss (tf.Tensor): Policy loss value.
            value_loss (tf.Tensor): Critic loss value.
            entropy (tf.Tensor): Entropy bonus.
        """
        states = tf.cast(states, tf.float32)
        actions = tf.cast(actions, tf.int32)
        old_log_probs = tf.cast(old_log_probs, tf.float32)
        advantages = tf.cast(advantages, tf.float32)
        returns = tf.cast(returns, tf.float32)

        with tf.GradientTape() as tape:
            # Forward pass for actor
            logits = self.actor_model(states)
            action_probs = tf.nn.softmax(logits)
            new_log_probs = tf.nn.sparse_softmax_cross_entropy_with_logits(logits=logits, labels=actions)

            # Compute PPO clipped objective
            ratios = tf.exp(old_log_probs - new_log_probs)
            clipped_ratios = tf.clip_by_value(ratios, 1 - self.epsilon, 1 + self.epsilon)
            surrogate1 = ratios * advantages
            surrogate2 = clipped_ratios * advantages
            policy_loss = -tf.reduce_mean(tf.minimum(surrogate1, surrogate2))

            # Compute value loss (critic)
            values = tf.squeeze(self.critic_model(states), axis=-1)
            value_loss = tf.reduce_mean(tf.square(returns - values))

            # Entropy bonus for exploration
            entropy = -tf.reduce_mean(action_probs * tf.math.log(action_probs + 1e-8))
            total_loss = policy_loss + self.c1 * value_loss - self.c2 * entropy

        # Compute and clip gradients
        gradients = tape.gradient(total_loss, self.actor_model.trainable_variables + self.critic_model.trainable_variables)
        gradients, _ = tf.clip_by_global_norm(gradients, 0.5)

        # Replace NaNs/Infs in gradients with zeros
        gradients = [tf.where(tf.math.is_finite(grad), grad, tf.zeros_like(grad)) for grad in gradients]

        # Apply gradients to models
        actor_grads = gradients[:len(self.actor_model.trainable_variables)]
        critic_grads = gradients[len(self.actor_model.trainable_variables):]

        self.actor_optimizer.apply_gradients(zip(actor_grads, self.actor_model.trainable_variables))
        self.critic_optimizer.apply_gradients(zip(critic_grads, self.critic_model.trainable_variables))

        return policy_loss, value_loss, entropy

    def compute_advantages(self, rewards, values, dones, next_value, normalize_rewards=False):
        """
        Compute advantages and returns using Generalized Advantage Estimation (GAE).
        
        Args:
            rewards (np.array): Collected rewards.
            values (np.array): Predicted values from the critic.
            dones (np.array): Episode done flags.
            next_value (float): Value of the next state.
            normalize_rewards (bool): Whether to normalize rewards.
        
        Returns:
            advantages (np.array): Computed advantages.
            returns (np.array): Discounted returns.
        """
        if normalize_rewards:
            rewards_std = np.std(rewards) + 1e-8  # Prevent division by zero
            rewards = (rewards - np.mean(rewards)) / rewards_std

        advantages = np.zeros_like(rewards, dtype=np.float32)
        gae = 0.0

        for t in reversed(range(len(rewards))):
            next_val = next_value if t == len(rewards) - 1 else values[t + 1]
            mask = 1.0 - dones[t]
            delta = rewards[t] + self.gamma * next_val * mask - values[t]
            gae = delta + self.gamma * self.lambda_gae * mask * gae
            advantages[t] = gae

        returns = advantages + values

        # Normalize advantages for stability
        advantages = (advantages - np.mean(advantages)) / (np.std(advantages) + 1e-8)

        return advantages.astype(np.float32), returns.astype(np.float32)
