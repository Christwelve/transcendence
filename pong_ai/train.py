import os
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"

from env import PongEnv
from ppo_agent import PPOAgent
import numpy as np
import tensorflow as tf
from collections import deque
import matplotlib.pyplot as plt

def train_ppo():
    # Environment and agent setup
    env = PongEnv()
    state_dim = env.get_normalized_state().shape[0]
    action_dim = 1
    
    agent = PPOAgent(input_dim=state_dim, action_dim=action_dim)
    
    # Training parameters
    num_episodes = 500
    max_steps_per_episode = 1000
    update_interval = 25
    num_epochs = 10
    batch_size = 64
    
    # Metrics tracking
    reward_history = deque(maxlen=100)
    episode_length_history = deque(maxlen=100)
    policy_loss_history = []
    value_loss_history = []
    entropy_history = []
    
    # Training loop
    total_steps = 0
    best_average_reward = float('-inf')
    
    for episode in range(num_episodes):
        state = env.reset()
        episode_reward = 0
        episode_steps = 0
        
        # Storage
        states = []
        actions = []
        rewards = []
        values = []
        log_probs = []
        dones = []
        
        while episode_steps < max_steps_per_episode:
            # Get action and value
            state_tensor = tf.convert_to_tensor([state], dtype=tf.float32)
            action, log_prob, value = agent.get_action_and_value(state_tensor)
            
            # Take action in environment
            action_np = action.numpy()[0]
            next_state, reward, done = env.step(action_np[0])
            
            # Store transition
            states.append(state)
            actions.append(action_np)
            rewards.append(reward)
            values.append(value.numpy()[0])
            log_probs.append(log_prob.numpy()[0])
            dones.append(done)
            
            state = next_state
            episode_reward += reward
            episode_steps += 1
            total_steps += 1
            
            if done or episode_steps >= max_steps_per_episode:
                break
        
        # Convert to numpy arrays
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
        
        # Update policy
        indices = np.arange(len(states))
        for _ in range(num_epochs):
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
                
                # Track losses and entropy
                policy_loss_history.append(policy_loss.numpy())
                value_loss_history.append(value_loss.numpy())
                entropy_history.append(entropy.numpy())
        
        # Track metrics
        reward_history.append(episode_reward)
        episode_length_history.append(episode_steps)
        avg_reward = np.mean(reward_history)
        avg_length = np.mean(episode_length_history)
        
        # Save best model
        if avg_reward > best_average_reward:
            best_average_reward = avg_reward
            agent.actor_model.save('models/best_actor.keras')
            agent.critic_model.save('models/best_critic.keras')
        
        # Save latest model
        agent.actor_model.save('models/latest_actor.keras')
        agent.critic_model.save('models/latest_critic.keras')
        
        # Print progress
        if (episode + 1) % 10 == 0:
            print(f"Episode {episode + 1}")
            print(f"Average Episode Length: {avg_length:.2f}")
            print(f"Average Reward: {avg_reward:.2f}")
            print(f"Best Average Reward: {best_average_reward:.2f}")
            print(f"Last Policy Loss: {policy_loss_history[-1]:.4f}")
            print(f"Last Value Loss: {value_loss_history[-1]:.4f}")
            print(f"Last Entropy: {entropy_history[-1]:.4f}")
            print("-" * 50)
    
    # Plot training metrics
    plt.figure(figsize=(12, 8))
    plt.subplot(3, 1, 1)
    plt.plot(policy_loss_history, label='Policy Loss')
    plt.xlabel('Updates')
    plt.ylabel('Loss')
    plt.title('Policy Loss over Time')
    plt.legend()
    
    plt.subplot(3, 1, 2)
    plt.plot(value_loss_history, label='Value Loss')
    plt.xlabel('Updates')
    plt.ylabel('Loss')
    plt.title('Value Loss over Time')
    plt.legend()
    
    plt.subplot(3, 1, 3)
    plt.plot(entropy_history, label='Entropy')
    plt.xlabel('Updates')
    plt.ylabel('Entropy')
    plt.title('Entropy over Time')
    plt.legend()
    
    plt.tight_layout()
    plt.savefig('training_metrics.png')
    plt.show()

if __name__ == "__main__":
    os.makedirs('models', exist_ok=True)
    train_ppo()