import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, optimizers

class PPOAgent:
    def __init__(self,
                 input_dim,
                 action_dim,
                 actor_lr=0.0003,
                 critic_lr=0.0001,
                 gamma=0.99,
                 epsilon=0.2,
                 lambda_gae=0.95,
                 c1=1.0,
                 c2=0.01):
        
        self.input_dim = input_dim
        self.action_dim = action_dim
        self.actor_lr = actor_lr
        self.critic_lr = critic_lr
        self.gamma = gamma
        self.epsilon = epsilon
        self.lambda_gae = lambda_gae
        self.c1 = c1
        self.c2 = c2

        # Initialize models
        self.actor_model = None
        self.critic_model = None
        self.build_models()

    def build_models(self):
        # Actor network
        inputs = layers.Input(shape=(self.input_dim,))
        x = layers.Dense(128, activation='relu')(inputs)
        x = layers.Dense(128, activation='relu')(x)
        x = layers.Dense(64, activation='relu')(x)
        
        # Separate heads for mean and std
        mu = layers.Dense(self.action_dim, activation='tanh')(x)
        log_std = layers.Dense(self.action_dim, activation='tanh')(x)
        log_std = layers.Lambda(lambda x: -2.0 + 0.5 * x)(log_std)  # Constrain log_std
        
        self.actor_model = tf.keras.Model(inputs=inputs, outputs=[mu, log_std])
        self.actor_optimizer = optimizers.Adam(learning_rate=self.actor_lr)

        # Critic network with similar architecture
        inputs = layers.Input(shape=(self.input_dim,))
        x = layers.Dense(128, activation='relu')(inputs)
        x = layers.Dense(128, activation='relu')(x)
        x = layers.Dense(64, activation='relu')(x)
        value = layers.Dense(1)(x)
        
        self.critic_model = tf.keras.Model(inputs=inputs, outputs=value)
        self.critic_model.compile(
            optimizer=optimizers.Adam(learning_rate=self.critic_lr),
            loss='mse'
        )

    @tf.function
    def get_action_and_value(self, state):
        state = tf.cast(state, tf.float32)
        mu, log_std = self.actor_model(state)
        std = tf.exp(log_std)
        
        # Sample action using reparameterization trick
        eps = tf.random.normal(shape=mu.shape)
        action = mu + eps * std
        
        # Compute log probability
        log_prob = -0.5 * (
            tf.square((action - mu) / (std + 1e-8))
            + 2 * log_std
            + tf.math.log(2 * np.pi)
        )
        log_prob = tf.reduce_sum(log_prob, axis=-1)
        
        # Get value estimate
        value = self.critic_model(state)
        
        return action, log_prob, value

    @tf.function
    def train_step(self, states, actions, old_log_probs, advantages, returns):
        with tf.GradientTape() as tape:
            mu, log_std = self.actor_model(states)
            std = tf.exp(log_std)
            
            # Compute new log probabilities
            log_probs = -0.5 * (
                tf.square((actions - mu) / (std + 1e-8))
                + 2 * log_std
                + tf.math.log(2 * np.pi)
            )
            log_probs = tf.reduce_sum(log_probs, axis=-1)
            
            # Compute ratio and policy loss
            ratio = tf.exp(log_probs - old_log_probs)
            clip_ratio = tf.clip_by_value(ratio, 1 - self.epsilon, 1 + self.epsilon)
            
            policy_loss = -tf.reduce_mean(
                tf.minimum(
                    ratio * advantages,
                    clip_ratio * advantages
                )
            )
            
            # Compute value loss
            values = self.critic_model(states)
            value_loss = tf.reduce_mean(tf.square(returns - values))
            
            # Compute entropy bonus
            entropy = tf.reduce_mean(
                0.5 * (tf.math.log(2 * np.pi * tf.square(std)) + 1)
            )
            
            # Total loss
            total_loss = policy_loss + self.c1 * value_loss - self.c2 * entropy

        # Compute and apply gradients
        variables = self.actor_model.trainable_variables + self.critic_model.trainable_variables
        gradients = tape.gradient(total_loss, variables)
        
        # Clip gradients for stability
        gradients, _ = tf.clip_by_global_norm(gradients, 0.5)
        
        # Apply gradients to both networks
        self.actor_optimizer.apply_gradients(
            zip(gradients[:len(self.actor_model.trainable_variables)],
                self.actor_model.trainable_variables)
        )
        self.critic_model.optimizer.apply_gradients(
            zip(gradients[len(self.actor_model.trainable_variables):],
                self.critic_model.trainable_variables)
        )
        
        return policy_loss, value_loss, entropy

    def compute_advantages(self, rewards, values, dones, next_value):
        advantages = np.zeros_like(rewards)
        gae = 0
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
        
        return advantages, returns
