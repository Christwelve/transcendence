import os
from env import PongEnv
from ppo_agent import PPOAgent
from collections import deque
import numpy as np

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

# For tracking reward history
reward_history = deque(maxlen=100)


#Training loop
for episode in range(max_episodes):
    state = env.reset()
    done = False
    total_reward = 0
    steps = 0

    # Storage for training data
    states_arr = []
    actions_arr = []
    old_log_probs_arr = []
    rewards_arr = []
    dones_arr = []
    values_arr = []

    while not done and steps < max_steps_per_episode:
        # Get action and log probability from the policy
        action, log_prob = agent.get_action(state)
        value = agent.critic_model.predict(np.array([state]), verbose=0)[0, 0]

        # Extract action for the environment
        action_env = action[0]
        next_state, reward, done = env.step(action_env)

        # Store transition data
        states_arr.append(state)
        actions_arr.append(action)
        old_log_probs_arr.append(log_prob)
        rewards_arr.append(reward)
        dones_arr.append(done)
        values_arr.append(value)

        state = next_state
        total_reward += reward
        steps += 1

    # Log progress
    reward_history.append(total_reward)
    average_reward = np.mean(reward_history)
    print(f"Episode {episode+1}/{max_episodes}, Total Reward: {total_reward}, Average Reward: {average_reward:.2f}")
