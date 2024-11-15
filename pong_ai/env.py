import json
import time
import os
import numpy as np

STATE_FILE_PATH = "./game_state.json"
LOG_FILE_PATH = "./data/game_log.json"


class PongEnv:
    def __init__(self):
        self.state = self.load_state()
        self.done = False
        # Load existing log if avalable
        self.log = self.load_log()

        # Constants for env
        self.screen_height = 400
        self.paddle_height = 80
        self.max_paddle_speed = 10
        
    def load_log(self):
        if os.path.exists(LOG_FILE_PATH):
            with open(LOG_FILE_PATH, "r") as f:
                return json.load(f)
        return []
    
    def load_state(self):
        with open(STATE_FILE_PATH, "r") as f:
            return json.load(f)
        # Default state if the file doesn t exist
        return {
            "ai_paddle": (self.screen_height / 2 - self.paddle_height / 2),
            "ball_x": 400,
            "ball_y": 200,
            "ball_speed_x": 5,
            "ball_speed_y": 5,
            "ball_missed": False
        }

    def reset(self):
        self.done = False
        self.state = self.load_state()
        return self.get_normalized_state()

    # Step returns (state, reward, done) tuple, with state as np.array
    def step(self, action):
        # Action = continuous value ==> paddle velocity
        # Clip the action to the maximum paddle speed
        paddle_velocity = max(-self.max_paddle_speed, min(self.max_paddle_speed, action))

        self.state["ai_paddle"] += paddle_velocity
        self.state["ai_paddle"] = max(0, min(self.screen_height - self.paddle_height, self.state["ai_paddle"]))

        # Update ball position and check for collision
        self.update_ball()
        self.check_collisions()

        # Calculate reward + check if game = done
        reward = self.calc_reward()
        self.done = self.check_done()

        # Log state with time stamp
        self.log_state(action, reward)
        self.save_state()

        return self.get_normalized_state(), reward, self.done

    def get_normalized_state(self):
        normalized_state = np.array([
            "ai_paddle": (self.state["ai_paddle"] / (self.screen_height - self.paddle_height)) * 2 - 1,
            "ball_x": (self.state["ball_x"] / self.screen_height) * 2 - 1,
            "ball_y": (self.state["ball_y"] / self.screen_height) * 2 - 1,
            "ball_speed_x": self.state["ball_speed_x"] / self.max_paddle_speed,
            "ball_speed_y": self.state["ball_speed_y"] / self.max_paddle_speed,
            "ball_missed": self.state["ball_missed"]
        ], dtype=np.float32)
        return normalized_state

    def update_ball(self):
        self.state["ball_x"] += self.state["ball_speed_x"]
        self.state["ball_y"] += self.state["ball_speed_y"]


    def check_collisions(self):
    # Check collision with top and bottom walls
        if self.state["ball_y"] <= 0 \
            or self.state["ball_y"] >= self.screen_height:
            self.state["ball_speed_y"] *= -1

    # Check collision with paddle
        paddle_top = self.state["ai_paddle"]
        paddle_bottom = paddle_top + self.paddle_height
        paddle_x = 0 # assume paddle at x = 0

        if self.state["ball_x"] <= paddle_x + self.ball_size:
            if paddle_top <= self.state["ball_y"] <= paddle_bottom:
                self.state["ball_speed_x"] *= -1
                offset = (self.state["ball_y"] - paddle_top) - self.paddle_height / 2
                self.state["ball_speed_y"] = offset / (self.paddle_height / 2) * self.ball_speed

                # Ensure ball speed doesn't exceed max speed
                speed_magnitude = np.sqrt(self.state["ball_speed_x"]**2 + self.state["ball_speed_y"]**2)
                if speed_magnitude > self.ball_max_speed:
                    scale = self.ball_max_speed / speed_magnitude
                    self.state["ball_speed_x"] *= scale
                    self.state["ball_speed_y"] *= scale
            else:
                self.state["ball_missed"] = True
        elif self.state["ball_x"] > self.screen_width:
            # Reset ball if it goes beyond the right boundary
            self.reset_ball()

    def reset_ball(self):
        self.state["ball_x"] = self.screen_width / 2
        self.state["ball_y"] = random.uniform(self.ball_size, self.screen_height - self.ball_size)
        self.state["ball_speed_x"] = random.choice([-self.ball_speed, self.ball_speed])
        self.state["ball_speed_y"] = random.uniform(-self.ball_speed, self.ball_speed)
        self.state["ball_missed"] = False      
                
    def calc_reward(self):
        if self.state["ball_missed"]:
            return -10
        elif self.state["ball_hit"]:
            return 1
        else:
            return 0.2

    def check_done(self):
        return self.state["ball_missed"]

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
            json.dump(self.log, f, indent=2)
