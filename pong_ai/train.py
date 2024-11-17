import os
from env import PongEnv
from ppo_agent import PPOAgent


# Initialize environment and agent
env = PongEnv()
input_dim = env.get_normalized_state().shape[0]
action_dim = 1
agent = PPOAgent(input_dim=input_dim, action_dim=action_dim)
agent.build_models()

print("Training started...")

# Training hyperparameters
max_episodes = 100
max_steps_per_episode = 1000
epochs = 10
batch_size = 64
save_frequency = 10

# Directory to save models
save_dir = 'models'
os.makedirs(save_dir, exist_ok=True)