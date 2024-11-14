from env import PongEnv, LOG_FILE_PATH
import json


env = PongEnv()

# Test the reset function
print("Testing reset...")
initial_state = env.reset()
print("Initial state:", initial_state)
print("\n")


actions = ["up", "down", "up", "down"]

print("Testing actions...")
for action in actions:
    state, reward, done = env.step(action)
    print(f"Action: {action}")
    print(f"State after action: {state}")
    print(f"Reward: {reward}")
    print(f"Done: {done}")
    print("\n")


print("Checking log entries...")
try:
    with open(LOG_FILE_PATH, "r") as f:
        logs = json.load(f)
    print("Log entries found:")
    for entry in logs[-5:]:
        print(entry)
except FileNotFoundError:
    print("Log file not found. Logging might not be working correctly.")
