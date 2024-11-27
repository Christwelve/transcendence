import os
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"

from env import PongEnv
from ppo_agent import PPOAgent
import numpy as np # type: ignore
import tensorflow as tf
from collections import deque
import matplotlib.pyplot as plt

print("Num GPUs Available:", len(tf.config.list_physical_devices('GPU')))

def train_ppo():
    # Environment and agent setup
    env = PongEnv()
    state_dim = env.get_normalized_state().shape[0]
    action_dim = 1

    agent = PPOAgent(input_dim=state_dim, action_dim=action_dim)

    # Training parameters
    num_episodes = 1000
    max_steps_per_pisode = 1000
    num_epochs = 20
    batch_size = 64
    save_interval = 500
    
    # Metrics tracking
    reward_history = deque(maxlen=100)
    episode_length_history = deque(maxlen=100)
    policy_loss_history = []
    value_loss_history = []
    entropy_history = []
    best_average_reward_history = []

    # Initialize best average reward
    best_average_reward = float('-inf')

    for episode in range(num_episodes):
        state = env.reset()
        episode_reward = 0
        episode_steps = 0

        # Storage for transitions
        states = []
        actions = []
        rewards = []
        values = []
        log_probs = []
        dones = []

        while episode_steps < max_steps_per_pisode:
            # Get action and value from the agent
            state_tensor = tf.convert_to_tensor([state], dtype=tf.float32)
            action, log_prob, value = agent.get_action_and_value(state_tensor)

            # Take action in the environment
            action_np = action.numpy().item()
            # Assuming the environment expects a list or array for action
            next_state, reward, done = env.step(action_np)

            # Store the transition
            states.append(state)
            actions.append(action_np)
            rewards.append(reward)
            values.append(value.numpy()[0])
            log_probs.append(log_prob.numpy()[0])
            dones.append(done)

            # Update state and episode metrics
            state = next_state
            episode_reward += reward
            episode_steps += 1

            if done or episode_steps >= max_steps_per_pisode:
                break

        # Convert lists to numpy arrays for processing
        states = np.array(states, dtype=np.float32)
        actions = np.array(actions, dtype=np.float32)
        rewards = np.array(rewards, dtype=np.float32)
        values = np.array(values, dtype=np.float32)
        log_probs = np.array(log_probs, dtype=np.float32)
        dones = np.array(dones, dtype=np.float32)

        # Compute advantages and returns
        if done:
            next_value = 0.0
        else: 
            next_value = agent.get_action_and_value(
                tf.convert_to_tensor([next_state], dtype=tf.float32)
            )[2].numpy()[0]

        advantages, returns = agent.compute_advantages(rewards, values, dones, next_value)

        # Initialize lists to store losses for this episode
        episode_policy_losses = []
        episode_value_losses = []
        episode_entropies = []

        # Perform policy updates
        for epoch in range(num_epochs):
            # Shuffle the indices for each epoch
            indices = np.arange(len(states))
            np.random.shuffle(indices)

            for start in range(0, len(states), batch_size):
                end = start + batch_size
                batch_indices = indices[start:end]

                # Get the batch data
                batch_states = states[batch_indices]
                batch_actions = actions[batch_indices]
                batch_old_log_probs = log_probs[batch_indices]
                batch_advantages = advantages[batch_indices]
                batch_returns = returns[batch_indices]

                # Perform a training step
                policy_loss, value_loss, entropy = agent.train_step(
                    batch_states,
                    batch_actions,
                    batch_old_log_probs,
                    batch_advantages,
                    batch_returns
                )

                # Append losses to episode-specific lists
                episode_policy_losses.append(policy_loss.numpy())
                episode_value_losses.append(value_loss.numpy())
                episode_entropies.append(entropy.numpy())

        # After all epochs, append the mean losses to history
        if episode_policy_losses:
            policy_loss_history.append(np.mean(episode_policy_losses))
        if episode_value_losses:
            value_loss_history.append(np.mean(episode_value_losses))
        if episode_entropies:
            entropy_history.append(np.mean(episode_entropies))

        # Track rewards and episode lengths
        reward_history.append(episode_reward)
        episode_length_history.append(episode_steps)
        avg_reward = np.mean(reward_history)
        avg_length = np.mean(episode_length_history)

        # Update the best average reward and save the model if improved
        if avg_reward > best_average_reward:
            best_average_reward = avg_reward
            agent.actor_model.save('models/best_actor.keras')
            agent.critic_model.save('models/best_critic.keras')

        # Save the latest model at specified intervals
        if (episode + 1) % save_interval == 0:
            agent.actor_model.save(f'models/actor_episode_{episode + 1}.keras')
            agent.critic_model.save(f'models/critic_episode_{episode + 1}.keras')

        # Append to best average reward history for plotting
        best_average_reward_history.append(best_average_reward)

        # Print progress every 10 episodes
        if (episode + 1) % 10 == 0:
            # Safely get the last policy loss, value loss, and entropy
            last_policy_loss = policy_loss_history[-1] if policy_loss_history else float('nan')
            last_value_loss = value_loss_history[-1] if value_loss_history else float('nan')
            last_entropy = entropy_history[-1] if entropy_history else float('nan')

            print(f"Episode {episode + 1}")
            print(f"Average Episode Length: {avg_length:.2f}")
            print(f"Average Reward: {avg_reward:.2f}")
            print(f"Best Average Reward: {best_average_reward:.2f}")
            print(f"Last Policy Loss: {last_policy_loss:.4f}")
            print(f"Last Value Loss: {last_value_loss:.4f}")
            print(f"Last Entropy: {last_entropy:.4f}")
            print("-" * 50)

    # Plot training metrics
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
    plt.plot(best_average_reward_history, label='Best Average Reward', color='green')
    plt.xlabel('Episodes')
    plt.ylabel('Average Reward')
    plt.title('Best Average Reward over Time')
    plt.legend()

    # Average Episode Length
    plt.subplot(3, 2, 5)
    plt.plot(episode_length_history, label='Average Episode Length')
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
