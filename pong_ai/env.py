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
        self.paddle_width = 10
        self.paddle_speed = 10
        self.ball_size = 20
        self.ball_speed = 7
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
        # Clip action and move paddle
        action = float(action)
        # print("Received action:", action, type(action))
        
        paddle_velocity = max(-self.paddle_speed, min(self.paddle_speed, action))
        paddle_velocity = float(paddle_velocity)
        # print("Paddle velocity:", paddle_velocity)
        
        self.state["ai_paddle"] += paddle_velocity
        self.state["ai_paddle"] = max(0, min(self.screen_height - self.paddle_height, self.state["ai_paddle"]))
        # print("New ai_paddle position:", self.state["ai_paddle"])
        
        # Update paddle_idle state
        self.state["paddle_idle"] = paddle_velocity == 0

        # Update ball position and check for collision
        self.update_ball()
        self.check_collisions()

        # Calculate reward
        reward = self.calc_reward()

        # Handle NaN or Inf rewards
        if np.isnan(reward) or np.isinf(reward):
            print(f"NaN or Inf detected in reward! State: {self.state}, Action: {action}")
            reward = -1.0  # Assign a default penalty
            self.done = True  # End the episode

        # Check if episode is done
        self.done = self.done or self.check_done()

        # Log the state, action, and reward
        self.log_state(action, reward)

        return self.get_normalized_state(), reward, self.done

    def get_normalized_state(self):
        # print("ai_paddle:", self.state["ai_paddle"], type(self.state["ai_paddle"]))
        # print("ball_x:", self.state["ball_x"], type(self.state["ball_x"]))
        # print("ball_y:", self.state["ball_y"], type(self.state["ball_y"]))
        # print("ball_speed_x:", self.state["ball_speed_x"], type(self.state["ball_speed_x"]))
        # print("ball_speed_y:", self.state["ball_speed_y"], type(self.state["ball_speed_y"]))

        # print("ai_paddle in get_normalized_state:", self.state["ai_paddle"])  # Debugging print
        normalized_paddle = (self.state["ai_paddle"] / (self.screen_height - self.paddle_height)) * 2 - 1
        # print("Normalized ai_paddle:", normalized_paddle)
        return np.array([
            # (self.state["ai_paddle"] / (self.screen_height - self.paddle_height)) * 2 - 1,
            normalized_paddle,
            (self.state["ball_x"] / self.screen_width) * 2 - 1,
            (self.state["ball_y"] / self.screen_height) * 2 - 1,
            self.state["ball_speed_x"] / self.ball_max_speed,
            self.state["ball_speed_y"] / self.ball_max_speed,
        ], dtype=np.float32)


    def update_ball(self):
        self.state["ball_x"] += self.state["ball_speed_x"]
        self.state["ball_y"] += self.state["ball_speed_y"]

    def check_collisions(self):
        # Reset ball_hit and ball_missed states
        self.state["ball_hit"] = False
        self.state["ball_missed"] = False

        # Check collision with top and bottom walls
        if self.state["ball_y"] <= 0 or self.state["ball_y"] >= self.screen_height:
            self.state["ball_speed_y"] *= -1  # Reverse vertical direction

        # Check collision with AI paddle
        paddle_top = self.state["ai_paddle"]
        paddle_bottom = paddle_top + self.paddle_height
        paddle_x = 0  # AI paddle is on the left side of the screen

        # If the ball is at the paddle's x-coordinate
        if self.state["ball_x"] <= paddle_x + self.ball_size:
            if paddle_top <= self.state["ball_y"] <= paddle_bottom:
                # Ball hit the paddle
                self.state["ball_hit"] = True
                self.state["ball_speed_x"] *= -1  # Reverse horizontal direction

                # Calculate ball speed offset based on where it hits the paddle
                offset = (self.state["ball_y"] - paddle_top) - self.paddle_height / 2
                self.state["ball_speed_y"] = (offset / (self.paddle_height / 2)) * self.ball_speed

                # Ensure ball speed doesn't exceed the max speed
                speed_magnitude = np.sqrt(self.state["ball_speed_x"]**2 + self.state["ball_speed_y"]**2)
                if speed_magnitude > self.ball_max_speed:
                    scale = self.ball_max_speed / speed_magnitude
                    self.state["ball_speed_x"] *= scale
                    self.state["ball_speed_y"] *= scale
            else:
                # Ball missed the paddle
                self.state["ball_missed"] = True
                self.done = True  # End the episode

        # Check collision with player paddle (if applicable)
        player_paddle_top = self.state.get("player_paddle", 0)
        player_paddle_bottom = player_paddle_top + self.paddle_height
        player_paddle_x = self.screen_width - self.paddle_width  # Player paddle is on the right

        if self.state["ball_x"] >= player_paddle_x - self.ball_size:
            if player_paddle_top <= self.state["ball_y"] <= player_paddle_bottom:
                # Ball hit the player paddle
                self.state["ball_speed_x"] *= -1  # Reverse horizontal direction
            else:
                # Ball missed the player paddle (optional for multiplayer mode)
                self.state["ball_missed"] = True
                self.done = True  # End the episode

    def reset_ball(self):
        # Reset ball to the center of the screen
        self.state["ball_x"] = self.screen_width // 2
        self.state["ball_y"] = self.screen_height // 2

        # Randomize ball speed and direction
        self.state["ball_speed_x"] = self.ball_speed * random.choice([-1, 1])
        self.state["ball_speed_y"] = self.ball_speed * random.choice([-1, 1])

        # Reset hit/missed states
        self.state["ball_hit"] = False
        self.state["ball_missed"] = False

    def calc_reward(self):
        reward = 0.0

        # Penalty for missing the ball
        if self.state.get("ball_missed", False):
            reward = -1.0  # Larger penalty for missing the ball
            return reward

        # Penalty for idle paddle (only if far from the ball)
        paddle_y = self.state.get("ai_paddle", 0)
        ball_y = self.state.get("ball_y", 0)
        if self.state.get("paddle_idle", False) and abs(paddle_y - ball_y) > 0.1 * self.screen_height:
            reward -= 0.1  # Slightly higher penalty for being idle when far from the ball

        # Reward for hitting the ball
        if self.state.get("ball_hit", False):
            ball_speed_x = abs(self.state.get("ball_speed_x", 0)) / self.screen_width
            reward += 1.0 + ball_speed_x  # Higher reward for hitting faster balls

        # Proximity-based reward
        proximity_factor = 1.0  # Emphasize staying close to the ball
        proximity_reward = proximity_factor * max(0.0, 1.0 - abs(paddle_y - ball_y) / self.screen_height)
        reward += 0.7 * proximity_reward

        # Future position prediction (optional)
        ball_speed_y = self.state.get("ball_speed_y", 0)
        if self.state.get("ball_speed_x", 0) != 0:
            # Predict the ball's future y position when it reaches the paddle's x-coordinate
            distance_to_paddle = abs(self.state["ball_x"] - (0 + self.ball_size))  # AI paddle at x=0
            if self.state["ball_speed_x"] < 0:
                time_to_paddle = distance_to_paddle / abs(self.state["ball_speed_x"])
                predicted_ball_y = self.state["ball_y"] + ball_speed_y * time_to_paddle

                # Reflect off the top and bottom walls if necessary
                while predicted_ball_y < 0 or predicted_ball_y > self.screen_height:
                    if predicted_ball_y < 0:
                        predicted_ball_y = -predicted_ball_y
                    elif predicted_ball_y > self.screen_height:
                        predicted_ball_y = 2 * self.screen_height - predicted_ball_y

                predicted_proximity_reward = proximity_factor * max(0.0, 1.0 - abs(paddle_y - predicted_ball_y) / self.screen_height)
                reward += 0.3 * predicted_proximity_reward  # Weight future prediction reward lower

        # Clip reward to a reasonable range
        reward = np.clip(reward, -1.0, 1.0)

        return float(reward)

    def check_done(self):
        # Episode ends if the ball goes out of bounds
        if self.state["ball_x"] <= 0 or self.state["ball_x"] >= self.screen_width:
            return True
        return False

    def log_state(self, action, reward):
        log_entry = {
            "timestamp": time.time(),
            "state": self.state.copy(),
            "action": action,
            "reward": reward,
        }
        self.log.append(log_entry)
