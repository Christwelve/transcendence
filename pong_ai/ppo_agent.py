import numpy as np
import tensorflow as tf
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
        pass

    # Compute advantage estimates using Generalized Advantage Estimation
    def compute_advantages(self, rewards, values, dones, next_values):
        pass

    # Update the policy and value nw usin PPO objective
    def update(self, states, actions, old_log_probs, advantages, returns):
        pass