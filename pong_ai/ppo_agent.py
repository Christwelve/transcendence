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
        pass

    # Build the policy and value models
    def build_models(self):
        pass

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