from env import PongEnv

env = PongEnv()

print("Testing reset...")
state = env.reset()
print(f"Initial normalized state: {state}")

print("\nTesting actions...")
action = 5.0 
state, reward, done = env.step(action)
print(f"After action {action}, state: {state}, reward: {reward}, done: {done}")

action = -5.0
state, reward, done = env.step(action)
print(f"After action {action}, state: {state}, reward: {reward}, done: {done}")

action = 0.0
state, reward, done = env.step(action)
print(f"After action {action}, state: {state}, reward: {reward}, done: {done}")
