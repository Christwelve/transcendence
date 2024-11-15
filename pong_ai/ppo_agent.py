import numpy as np
import tensorflow as tf
import random
from tensorflow.keras import layers, optimizers, losses

class PPOAgent:
    # Init the PPO agent with given hyperparams
    def __init__(self,
                 input_dim, # dim of the input(state space)
                 action_dim, # dim of the output
                 actor_lr = 0.003, # actor nw --> predicts policy based on state
                 critic_lr=0.001, # critic nw --> predicts value of state
                 gamma=0.99, # discound factor for future rewards
                 epsilon=0.2, # clipping parameter, limits the update size of the policy
                 lambda_gae=0.95, # balances bias and variance in advantage estimation
                 c1=0.5, # entropy coeff in ppo obj, balances contribution of value loss relative to policy loss
                 c2=0.01 # entropy coeff in ppo obj, encourages exploration
                 ):
        self.input_dim = input_dim
        self.action_dim = action_dim
        self.actor_lr = actor_lr
        self.critic_lr = critic_lr
        self.gamma = gamma
        self.epsilon = epsilon
        self.lambda_gae = lambda_gae
        self.c1 = c1
        self.c2 = c2

        # Placeholders for policy(actor) and value(critic) NW
        self.actor_model = None
        self.critic_model = None


    # Build the policy and value models
    def build_models(self):
        self.build_actor_model()
        self.build_critic_model()

    # ..::Actor (policy) NW::..
    def build_actor_model(self):
        inputs = tf.keras.Input(shape=(self.input_dim,))
        x = self.build_dense_layers(inputs)

        # Output mean and log_std
        mu = layers.Dense(self.action_dim, activation='tanh')(x)  # Mean in [-1, 1]
        log_std = layers.Dense(self.action_dim, activation='softplus')(x)  # std > 0
        self.actor_model = tf.keras.Model(inputs=inputs, outputs=[mu, log_std])

        # Actor optimizer
        self.actor_optimizer = optimizers.Adam(learning_rate=self.actor_lr)

    # ..::Critic (value) NW::..
    def build_critic_model(self):
        critic_inputs = tf.keras.Input(shape=(self.input_dim,))
        v = self.build_dense_layers(critic_inputs)
        value = layers.Dense(1, activation='linear')(v)
        self.critic_model = tf.keras.Model(inputs=critic_inputs, outputs=value)

        # Compile critic model
        self.critic_model.compile(optimizer=optimizers.Adam(learning_rate=self.critic_lr), loss='mse')

    def build_dense_layers(self, input_layer):
        x = layers.Dense(64, activation='relu')(input_layer)
        x = layers.Dense(64, activation='relu')(x)
        return x


    # Given a state, compute the action and log 
    # probability under the current policy
    def get_action(self, state):
        state = np.array([state])
        mu, log_std = self.actor_model.predict(state)
        mu = mu[0]
        log_std = log_std[0]
        std = np.exp(log_std)

        # Sample action from the Gaussian distro
        action = np.random.normal(mu, std)

        # Clip action to be within the action space
        action = np.clip(action, -1, 1)

        # Calculate log prob of the action
        var = std ** 2
        log_prob = -0.5 * ((action - mu) ** 2 / var + 2 * log_std + np.log(2 * np.pi))
        log_prob = np.sum(log_prob)

        return action, log_prob
  
    # Compute advantage estimates using Generalized Advantage Estimation
    def compute_advantages(self, rewards, values, dones, next_values):
        values = np.append(values, next_value)
        advantages = np.zeros_like(rewards)
        gae = 0
        for t in reversed(range(len(rewards))):
            delta = rewards[t] + self.gamma * values[t + 1] * (1 - dones[t]) - values[t]
            gae = delta + self.gamma * self.lambda_gae * (1 - dones[t]) * gae
            advantages[t] = gae
        returns = advantages + values[:-1]
        return advantages, returns

    # Update the policy and value nw usin PPO objective
    def update(self, states, actions, old_log_probs, advantages, returns):
        pass