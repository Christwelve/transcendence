import os
import numpy as np
import tensorflow as tf
from collections import deque
import matplotlib.pyplot as plt
from env import PongEnv
from ppo_agent import PPOAgent

if tf.device('/GPU:0'):
    print('GPU use detected\n')

def setup_environment():
    """
    Set up the Pong environment and initialize the PPO agent.
    Returns:
        env (PongEnv): The Pong environment.
        agent (PPOAgent): The PPO agent.
        state_dim (int): The dimensionality of the state space.
        action_dim (int): The number of possible actions.
    """
    env = PongEnv()
    state_dim = env.get_normalized_state().shape[0]
    action_dim = 3  # [-1, 0, 1]
    agent = PPOAgent(input_dim=state_dim, action_dim=action_dim)
    return env, agent, state_dim, action_dim


def train_ppo():
    """
    Train the PPO agent in the Pong environment.
    """
    # Set up environment and PPO agent
    env, agent, state_dim, action_dim = setup_environment()

    # Training parameters
    num_episodes = 5000
    max_steps_per_episode = 1000
    num_epochs = 10
    batch_size = 64
    save_interval = 1000

    # Metrics tracking
    reward_history = deque(maxlen=100)
    episode_length_history = deque(maxlen=100)
    policy_loss_history = []
    value_loss_history = []
    entropy_history = []
    best_average_reward_history = []

    # Best average reward for saving the best model
    best_average_reward = float('-inf')
    action_mapping = {0: -1, 1: 0, 2: 1}  # Action mapping for PongEnv

    # Training loop
    for episode in range(num_episodes):
        state = env.reset()
        episode_reward = 0
        episode_steps = 0

        # Transition storage for one episode
        states, actions, rewards, values, log_probs, dones = [], [], [], [], [], []

        # Episode interaction
        while episode_steps < max_steps_per_episode:
            state_tensor = tf.convert_to_tensor([state], dtype=tf.float32)
            action_idx, log_prob, value = agent.get_action_and_value(state_tensor)
            action_idx = action_idx.numpy()[0]
            action = action_mapping[action_idx]

            # Perform environment step
            next_state, reward, done = env.step(action)

            # Store transitions
            states.append(state)
            actions.append(action_idx)
            rewards.append(reward)
            values.append(value.numpy()[0][0])
            log_probs.append(log_prob.numpy()[0])
            dones.append(done)

            state = next_state
            episode_reward += reward
            # print(f"Episode {episode + 1}, Step {episode_steps}, Reward: {reward:.3f}")
            episode_steps += 1

            if done:
                break

        # print(f"Episode {episode + 1} Total Reward: {episode_reward:.3f}")

        # Convert transitions to numpy arrays
        states, actions, rewards, values, log_probs, dones = map(
            lambda x: np.array(x, dtype=np.float32),
            [states, actions, rewards, values, log_probs, dones]
        )

        # Compute next state value
        next_value = 0.0 if done else agent.get_action_and_value(
            tf.convert_to_tensor([next_state], dtype=tf.float32)
        )[2].numpy()[0][0]

        # Calculate advantages and returns
        advantages, returns = agent.compute_advantages(rewards, values, dones, next_value, normalize_rewards=True)

        # Training updates
        episode_policy_losses, episode_value_losses, episode_entropies = [], [], []
        for epoch in range(num_epochs):
            indices = np.arange(len(states))
            np.random.shuffle(indices)

            for start in range(0, len(states), batch_size):
                end = start + batch_size
                batch_indices = indices[start:end]

                policy_loss, value_loss, entropy = agent.train_step(
                    states[batch_indices],
                    actions[batch_indices],
                    log_probs[batch_indices],
                    advantages[batch_indices],
                    returns[batch_indices]
                )

                episode_policy_losses.append(policy_loss.numpy())
                episode_value_losses.append(value_loss.numpy())
                episode_entropies.append(entropy.numpy())

        # Append metrics to history
        policy_loss_history.append(np.mean(episode_policy_losses))
        value_loss_history.append(np.mean(episode_value_losses))
        entropy_history.append(np.mean(episode_entropies))
        reward_history.append(episode_reward)
        episode_length_history.append(episode_steps)

        # Calculate average reward
        avg_reward = np.mean(reward_history)

        os.makedirs('models', exist_ok=True)
        # Save best model
        if avg_reward > best_average_reward:
            best_average_reward = avg_reward
            agent.actor_model.save('models/best_actor.keras')
            agent.critic_model.save('models/best_critic.keras')

        # Save periodically
        if (episode + 1) % save_interval == 0:
            agent.actor_model.save(f'models/actor_episode_{episode + 1}.keras')
            agent.critic_model.save(f'models/critic_episode_{episode + 1}.keras')

        best_average_reward_history.append(avg_reward)

        # Logging progress
        if (episode + 1) % 10 == 0:
            print(f"Episode {episode + 1}")
            print(f"Average Reward: {avg_reward:.2f}")
            print(f"Average Reward: {best_average_reward:.2f}")
            print(f"Last Policy Loss: {policy_loss_history[-1]:.4f}")
            print(f"Last Value Loss: {value_loss_history[-1]:.4f}")
            print(f"Last Entropy: {entropy_history[-1]:.4f}")
            print("-" * 50)

    # Plot training metrics
    plot_metrics(policy_loss_history, value_loss_history, entropy_history, best_average_reward_history, episode_length_history)


def plot_metrics(policy_loss_history, value_loss_history, entropy_history, best_avg_rewards, episode_lengths):
    """
    Plot and save training metrics.
    """
    plt.figure(figsize=(16, 12))

    # Policy Loss
    plt.subplot(3, 2, 1)
    plt.plot(policy_loss_history, label='Policy Loss')
    plt.xlabel('Updates')
    plt.ylabel('Loss')
    plt.title('Policy Loss over Time')
    plt.legend()

    # Value Loss
    plt.subplot(3, 2, 2)
    plt.plot(value_loss_history, label='Value Loss')
    plt.xlabel('Updates')
    plt.ylabel('Loss')
    plt.title('Value Loss over Time')
    plt.legend()

    # Entropy
    plt.subplot(3, 2, 3)
    plt.plot(entropy_history, label='Entropy')
    plt.xlabel('Updates')
    plt.ylabel('Entropy')
    plt.title('Entropy over Time')
    plt.legend()

    # Best Average Reward
    plt.subplot(3, 2, 4)
    plt.plot(best_avg_rewards, label='Best Average Reward', color='green')
    plt.xlabel('Episodes')
    plt.ylabel('Average Reward')
    plt.title('Average Reward over Time')
    plt.legend()

    # Average Episode Length
    plt.subplot(3, 2, 5)
    plt.plot(episode_lengths, label='Average Episode Length')
    plt.xlabel('Episodes')
    plt.ylabel('Length')
    plt.title('Average Episode Length over Time')
    plt.legend()

    plt.tight_layout()
    plt.savefig('training_metrics.png')
    plt.show()


if __name__ == "__main__":
    os.makedirs('models', exist_ok=True)
    train_ppo()
