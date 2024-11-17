import os
# os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"

from env import PongEnv
from ppo_agent import PPOAgent
from collections import deque
import numpy as np
import tensorflow as tf

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


def save_models(agent, save_dir, episode=None):
    if episode:
        actor_path = os.path.join(save_dir, f'actor_model_ep{episode}.keras')
        critic_path = os.path.join(save_dir, f'critic_model_ep{episode}.keras')
        log_std_path = os.path.join(save_dir, f'log_std_ep{episode}.npy')
    else:
        actor_path = os.path.join(save_dir, 'actor_model_final.keras')
        critic_path = os.path.join(save_dir, 'critic_model_final.keras')
        log_std_path = os.path.join(save_dir, 'log_std_final.npy')

    agent.actor_model.save(actor_path)
    agent.critic_model.save(critic_path)
    np.save(log_std_path, agent.log_std.numpy())
    print(f"Models saved{' at episode ' + str(episode) if episode else ' (final)'}.")


@tf.function
def train_step(agent, states, actions, old_log_probs, advantages, returns, epochs, batch_size):
    dataset = tf.data.Dataset.from_tensor_slices((states, actions, old_log_probs, advantages, returns))
    dataset = dataset.shuffle(buffer_size=len(states)).batch(batch_size)

    for epoch in range(epochs):
        for batch in dataset:
            agent.update(*batch)


# Training loop
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
        value = agent.critic_model.predict(np.array([state], dtype=np.float32), verbose=0)[0, 0]

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

    # Get last value for advantage computation
    next_value = agent.critic_model.predict(np.array([state], dtype=np.float32), verbose=0)[0, 0] if not done else 0.0

    # Convert arrays for training
    states_arr = np.array(states_arr, dtype=np.float32)
    actions_arr = np.array(actions_arr, dtype=np.float32)
    old_log_probs_arr = np.array(old_log_probs_arr, dtype=np.float32)
    rewards_arr = np.array(rewards_arr, dtype=np.float32)
    dones_arr = np.array(dones_arr, dtype=np.bool_)
    values_arr = np.array(values_arr, dtype=np.float32)

    # Compute advantages and returns
    advantages, returns = agent.compute_advantages(rewards_arr, values_arr, dones_arr, next_value)

    # Train PPO
    train_step(agent, states_arr, actions_arr, old_log_probs_arr, advantages, returns, epochs, batch_size)

    # Save periodically
    if (episode + 1) % save_frequency == 0:
        save_models(agent, save_dir, episode=episode + 1)

    # Log progress
    reward_history.append(total_reward)
    average_reward = np.mean(reward_history)
    print(f"Episode {episode+1}/{max_episodes}, Total Reward: {total_reward}, Average Reward: {average_reward:.2f}")

save_models(agent, save_dir)
