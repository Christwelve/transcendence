import json
import time
import os
import numpy as np
import random

class PongEnv:
    def __init__(self):
        self.done = False
        self.log = []
        self.screen_width = 800
        self.screen_height = 400
        self.paddle_height = 80
        self.paddle_speed = 10
        self.ball_size = 20
        self.ball_speed = 5
        self.ball_max_speed = 10
        self.reset()

    def reset(self):
        self.done = False
        self.state = {
            "ai_paddle": self.screen_height / 2 - self.paddle_height / 2,
            "ball_x": random.uniform(self.ball_size, self.screen_width - self.ball_size),
            "ball_y": random.uniform(self.ball_size, self.screen_height - self.ball_size),
            "ball_speed_x": random.choice([-self.ball_speed, self.ball_speed]),
            "ball_speed_y": random.uniform(-self.ball_speed, self.ball_speed),
            "ball_missed": False,
            "ball_hit": False,
            "paddle_idle": False,
        }
        return self.get_normalized_state()

    def step(self, action):
        # Track paddle position for idle detection
        previous_paddle_position = self.state["ai_paddle"]

        # Clip action and move paddle
        paddle_velocity = max(-self.paddle_speed, min(self.paddle_speed, action))
        self.state["ai_paddle"] += paddle_velocity
        self.state["ai_paddle"] = max(0, min(self.screen_height - self.paddle_height, self.state["ai_paddle"]))

        # Update paddle_idle state
        self.state["paddle_idle"] = previous_paddle_position == self.state["ai_paddle"]

        # Update ball position and check for collision
        self.update_ball()
        self.check_collisions()

        # Calculate reward and check if game is done
        reward = self.calc_reward()
        self.done = self.check_done()

        # Log state with time stamp
        self.log_state(action, reward)

        return self.get_normalized_state(), reward, self.done

    def get_normalized_state(self):
        return np.array([
            (self.state["ai_paddle"] / (self.screen_height - self.paddle_height)) * 2 - 1,
            (self.state["ball_x"] / self.screen_width) * 2 - 1,
            (self.state["ball_y"] / self.screen_height) * 2 - 1,
            self.state["ball_speed_x"] / self.ball_max_speed,
            self.state["ball_speed_y"] / self.ball_max_speed,
        ], dtype=np.float32)

    def update_ball(self):
        self.state["ball_x"] += self.state["ball_speed_x"]
        self.state["ball_y"] += self.state["ball_speed_y"]

    def check_collisions(self):
        # Reset ball_hit state
        self.state["ball_hit"] = False

        # Check collision with top and bottom walls
        if self.state["ball_y"] <= 0 or self.state["ball_y"] >= self.screen_height:
            self.state["ball_speed_y"] *= -1

        # Check collision with paddle
        paddle_top = self.state["ai_paddle"]
        paddle_bottom = paddle_top + self.paddle_height
        paddle_x = 0  # Assume paddle at x = 0

        if self.state["ball_x"] <= paddle_x + self.ball_size:
            if paddle_top <= self.state["ball_y"] <= paddle_bottom:
                # Ball hit the paddle
                self.state["ball_hit"] = True
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
        elif self.state["paddle_idle"]:
            return -1.0  # Penalize idle paddle
        elif self.state["ball_hit"]:
            return 1.0  # Reward for hitting the ball
        else:
            # Encourage staying near the ball's vertical position
            paddle_y = self.state["ai_paddle"]
            ball_y = self.state["ball_y"]
            proximity_reward = 1.0 - abs(paddle_y - ball_y) / self.screen_height
            proximity_reward = max(0.0, min(proximity_reward, 0.5))
            return 0.2 + proximity_reward

    def check_done(self):
        return self.state["ball_missed"]

    def log_state(self, action, reward):
        log_entry = {
            "timestamp": time.time(),
            "state": self.state.copy(),
            "action": action,
            "reward": reward,
        }
        self.log.append(log_entry)
