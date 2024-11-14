import json
import time

STATE_FILE_PATH = "./game_state.json"
LOG_FILE_PATH = "./data/game_log.json"


class PongEnv:
    def __init__:
        self.state = self.load_state()
        self.done = False
        # Load existing log if avalable
        self.log = self.load_log()

    def load_log(self):
        if os.path.exists(LOG_FILE_PATH):
            with open(LOG_FILE_PATH, "r") as f:
                return json.load(f)
        return []
    
    def load_state(self):
        with open(STATE_FILE_PATH, "r") as f:
            return json.load(f)

    def reset(self):
        self.done = False
        self.state = self.load_state()
        return self.state

    def step(self, action):
        # TODO: Change this to a continous spectrum with  velocity and direction
        if action == "up":
            self.state["ai_paddle"] = max(0, self.state["ai_paddle"] - 10)
        elif action == "down":
            self.state["ai_paddle"] = min(400, self.state["ai_paddle"] + 10)

        # TODO: Implement a more advanced reward calculation machanism that includes
        #       primary rewards and secondary ones
        # Calculate reward + check if game = done
        reward = self.calc_reward()
        self.done = self.check_done()

        # Log state with time stamp
        self.log_state(action, reward)
        self.save_state()

        return self.state, reward, self.done

    def calc_reward(self):
        return 1 if not self.state["ball_missed"] else -1

    def check_done(self):
        return self.state["ball missed"]

    def save_state(self):
        with open(STATE_FILE_PATH, "w") as f:
            json.dump(self.state, f)

    def log_state(self, action, reward):
        log_entry = {
            "timestamp": time.time(),
            "state": self.state.copy(),
            "action": action,
            "reward": reward
        }
        self.log.append(log_entry)

        # Append new entry to log file
        with open(LOG_FILE_PATH, "w") as f:
            json.dump(self.log, f, indent=4)  # Indent for readability

    # def render(self):
    #     print(f"Paddle Y: {self.state['ai_paddle']}, Ball: {self.state['ball']}")
        