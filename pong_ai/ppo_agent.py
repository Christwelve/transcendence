import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, optimizers, losses

class PPOAgent:
    # Init the PPO agent with given hyperparams
    def __init__(self):
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