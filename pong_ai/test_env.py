from env import PongEnv

env = PongEnv()

print("Testing reset...")
state = env.reset()
print(f"Initial state: {state}")

print("\nTesting actions...")
action = [5.0]  # Move the paddle down with velocity of 5
state, reward, done, info = env.step(action)
print(f"After action {action}, state: {state}, reward: {reward}, done: {done}")

action = [-5.0]  # Move the paddle up with velocity of -5
state, reward, done, info = env.step(action)
print(f"After action {action}, state: {state}, reward: {reward}, done: {done}")

action = [0.0]  # Keep the paddle stationary
state, reward, done, info = env.step(action)
print(f"After action {action}, state: {state}, reward: {reward}, done: {done}")

