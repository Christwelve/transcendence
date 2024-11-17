import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, optimizers

class PPOAgent:
    def __init__(self,
                 input_dim,
                 action_dim,
                 actor_lr=0.003,
                 critic_lr=0.001,
                 gamma=0.99,
                 epsilon=0.2,
                 lambda_gae=0.95,
                 c1=0.5,
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

        # Trainable variable for action standard deviation
        self.log_std = tf.Variable(initial_value=np.zeros(action_dim, dtype=np.float32),
                                    trainable=True, name="log_std")

        # Placeholders for policy (actor) and value (critic) networks
        self.actor_model = None
        self.critic_model = None

    def build_models(self):
        self.build_actor_model()
        self.build_critic_model()

    def build_actor_model(self):
        inputs = tf.keras.Input(shape=(self.input_dim,))
        x = self.build_dense_layers(inputs)

        # Output mean and log_std
        mu = layers.Dense(self.action_dim, activation='tanh')(x)  # Mean in [-1, 1]
        log_std = layers.Dense(self.action_dim, activation='softplus')(x)  # std > 0
        self.actor_model = tf.keras.Model(inputs=inputs, outputs=[mu, log_std])

        self.actor_optimizer = optimizers.Adam(learning_rate=self.actor_lr)


    def build_critic_model(self):
        inputs = tf.keras.Input(shape=(self.input_dim,))
        x = self.build_dense_layers(inputs)
        value = layers.Dense(1, activation='linear')(x)
        self.critic_model = tf.keras.Model(inputs=inputs, outputs=value)
        self.critic_model.compile(optimizer=optimizers.Adam(learning_rate=self.critic_lr), loss='mse')

    def build_dense_layers(self, input_layer):
        x = layers.Dense(64, activation='relu')(input_layer)
        x = layers.Dense(64, activation='relu')(x)
        return x

    def get_action(self, state):
        state = np.array([state])
        mu, log_std = self.actor_model.predict(state, verbose=0)
        mu = mu[0]
        log_std = log_std[0]
        std = np.exp(log_std)


        # Sample action from the Gaussian distribution
        action = np.random.normal(mu, std)

        # Clip action to be within the action space
        action = np.clip(action, -1, 1)

        # Calculate log prob of the action
        var = std ** 2
        log_prob = -0.5 * ((action - mu) ** 2 / var + 2 * log_std + np.log(2 * np.pi))
        log_prob = np.sum(log_prob)

        return action, log_prob


    def compute_advantages(self, rewards, values, dones, next_value):
        values = np.append(values, next_value)
        advantages = np.zeros_like(rewards, dtype=np.float32)
        gae = 0.0

        for t in reversed(range(len(rewards))):
            mask = 1.0 - dones[t]
            delta = rewards[t] + self.gamma * values[t + 1] * mask - values[t]
            gae = delta + self.gamma * self.lambda_gae * mask * gae
            advantages[t] = gae

        returns = advantages + values[:-1]
        return advantages, returns


    def update(self, states, actions, old_log_probs, advantages, returns, epochs=10, batch_size=64):
        dataset = tf.data.Dataset.from_tensor_slices((states, actions, old_log_probs, advantages, returns))
        dataset = dataset.shuffle(buffer_size=len(states)).batch(batch_size)

        for epoch in range(epochs):
            for batch in dataset:
                states_mb, actions_mb, old_log_probs_mb, advantages_mb, returns_mb = batch

                with tf.GradientTape() as tape:
                    states_mb = tf.cast(states_mb, tf.float32)
                    actions_mb = tf.cast(actions_mb, tf.float32)
                    old_log_probs_mb = tf.cast(old_log_probs_mb, tf.float32)
                    advantages_mb = tf.cast(advantages_mb, tf.float32)
                    returns_mb = tf.cast(returns_mb, tf.float32)

                    mu, log_std = self.actor_model(states_mb, training=True)
                    std = tf.exp(log_std)
                    var = std ** 2

                    # Compute log probabilities
                    log_probs = -0.5 * ((actions_mb - mu) ** 2 / var + 2 * log_std + tf.math.log(2 * np.pi))
                    log_probs = tf.reduce_sum(log_probs, axis=1)

                    # Compute policy ratio
                    ratio = tf.exp(log_probs - old_log_probs_mb)

                    # PPO loss components
                    surr1 = ratio * advantages_mb
                    surr2 = tf.clip_by_value(ratio, 1 - self.epsilon, 1 + self.epsilon) * advantages_mb
                    actor_loss = -tf.reduce_mean(tf.minimum(surr1, surr2))

                    # Critic loss
                    values = self.critic_model(states_mb, training=True)
                    critic_loss = tf.reduce_mean(tf.square(returns_mb - values))

                    # Entropy bonus
                    entropy = tf.reduce_mean(-0.5 * (tf.math.log(2 * np.pi * var) + 1))
                    total_loss = actor_loss + self.c1 * critic_loss - self.c2 * entropy

                # Compute gradients
                actor_params = self.actor_model.trainable_variables
                grads = tape.gradient(total_loss, actor_params)

                # Apply gradients
                self.actor_optimizer.apply_gradients(zip(grads, actor_params))

            # Update critic separately
            self.critic_model.train_on_batch(states_mb, returns_mb)
