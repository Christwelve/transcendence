import json
import time
import os
import numpy as np
import random

class PongEnv:
    def __init__(self):
        """
        Initialize environment parameters and state variables.
        """
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
        """
        Reset the environment to its initial state.
        Returns:
            Normalized state for the agent.
        """
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
        """
        Take one step in the environment based on the given action.
        Args:
            action (int): Discrete action (-1, 0, 1) for paddle movement.
        Returns:
            tuple: Normalized state, reward, and done flag.
        """
        # Map action to paddle velocity
        if action == -1:
            paddle_velocity = -self.paddle_speed
        elif action == 1:
            paddle_velocity = self.paddle_speed
        else:
            paddle_velocity = 0

        # Update paddle position
        self.state["ai_paddle"] += paddle_velocity
        self.state["ai_paddle"] = max(0, min(self.screen_height - self.paddle_height, self.state["ai_paddle"]))
        self.state["paddle_idle"] = paddle_velocity == 0

        # Update ball position and handle collisions
        self.update_ball()
        self.check_collisions()

        # Calculate reward and handle anomalies
        reward = self.calc_reward()
        if np.isnan(reward) or np.isinf(reward):
            print(f"NaN or Inf detected in reward! State: {self.state}, Action: {action}")
            reward = -1.0
            self.done = True

        # Check if episode is done
        self.done = self.done or self.check_done()

        # Log the current state, action, and reward
        self.log_state(action, reward)

        return self.get_normalized_state(), reward, self.done

    def get_normalized_state(self):
        """
        Normalize the state values for use in the agent's training.
        Returns:
            np.array: Normalized state.
        """
        normalized_paddle = (self.state["ai_paddle"] / (self.screen_height - self.paddle_height)) * 2 - 1
        return np.array([
            normalized_paddle,
            (self.state["ball_x"] / self.screen_width) * 2 - 1,
            (self.state["ball_y"] / self.screen_height) * 2 - 1,
            self.state["ball_speed_x"] / self.ball_max_speed,
            self.state["ball_speed_y"] / self.ball_max_speed,
        ], dtype=np.float32)

    def update_ball(self):
        """
        Update the ball's position based on its current speed.
        """
        self.state["ball_x"] += self.state["ball_speed_x"]
        self.state["ball_y"] += self.state["ball_speed_y"]

    def check_collisions(self):
        """
        Check and handle collisions of the ball with walls and paddles.
        """
        self.state["ball_hit"] = False
        self.state["ball_missed"] = False

        # Handle wall collisions
        if self.state["ball_y"] <= 0 or self.state["ball_y"] >= self.screen_height:
            self.state["ball_speed_y"] *= -1

        # Handle collisions with AI paddle
        paddle_top = self.state["ai_paddle"]
        paddle_bottom = paddle_top + self.paddle_height
        paddle_x = 0

        if self.state["ball_x"] <= paddle_x + self.ball_size:
            if paddle_top <= self.state["ball_y"] <= paddle_bottom:
                self.state["ball_hit"] = True
                self.state["ball_speed_x"] *= -1
                offset = (self.state["ball_y"] - paddle_top) - self.paddle_height / 2
                self.state["ball_speed_y"] = (offset / (self.paddle_height / 2)) * self.ball_speed
                speed_magnitude = np.sqrt(self.state["ball_speed_x"]**2 + self.state["ball_speed_y"]**2)
                if speed_magnitude > self.ball_max_speed:
                    scale = self.ball_max_speed / speed_magnitude
                    self.state["ball_speed_x"] *= scale
                    self.state["ball_speed_y"] *= scale
            else:
                self.state["ball_missed"] = True
                self.done = True

    def reset_ball(self):
        """
        Reset the ball to a random position in the playable space,
        ensuring it moves toward the AI paddle for meaningful training.
        """
        # Randomize the initial position of the ball within the full screen
        self.state["ball_x"] = random.uniform(self.ball_size, self.screen_width - self.ball_size)
        self.state["ball_y"] = random.uniform(self.ball_size, self.screen_height - self.ball_size)

        # Randomize horizontal speed to ensure both directions are tested equally
        self.state["ball_speed_x"] = random.choice([-1, 1]) * self.ball_speed

        # Randomize vertical speed for varied trajectories
        self.state["ball_speed_y"] = random.uniform(-self.ball_speed, self.ball_speed)

        self.state["ball_hit"] = False
        self.state["ball_missed"] = False

    def calc_reward(self):
        """
        Calculate the reward based on the current state.
        Returns:
            float: Reward value.
        """
        reward = 0.0

        # Penalize for missing the ball
        if self.state.get("ball_missed", False):
            return -1.0

        # Penalize idle paddle
        paddle_y = self.state.get("ai_paddle", 0)
        ball_y = self.state.get("ball_y", 0)
        if self.state.get("paddle_idle", False):
            distance_factor = abs(paddle_y - ball_y) / self.screen_height
            reward += -0.2 * distance_factor

        # Reward for hitting the ball
        if self.state.get("ball_hit", False):
            ball_speed_x = abs(self.state.get("ball_speed_x", 0)) / self.screen_width
            reward += 1.0 + 2.0 * ball_speed_x

        # Reward for proximity to the ball
        proximity_factor = 1.0
        proximity_reward = proximity_factor * max(0.0, 1.0 - abs(paddle_y - ball_y) / self.screen_height)
        reward += 0.7 * proximity_reward

        # Predict future position reward
        ball_speed_x = self.state.get("ball_speed_x", 0)
        ball_speed_y = self.state.get("ball_speed_y", 0)
        if ball_speed_x != 0:
            distance_to_paddle = abs(self.state["ball_x"] - (0 + self.ball_size))
            if ball_speed_x < 0:
                time_to_paddle = distance_to_paddle / abs(ball_speed_x)
                predicted_ball_y = self.state["ball_y"] + ball_speed_y * time_to_paddle
                predicted_ball_y = abs(predicted_ball_y) % (2 * self.screen_height)
                if predicted_ball_y > self.screen_height:
                    predicted_ball_y = 2 * self.screen_height - predicted_ball_y
                proximity_reward = proximity_factor * max(0.0, 1.0 - abs(paddle_y - predicted_ball_y) / self.screen_height)
                reward += 0.5 * proximity_reward

        return float(np.clip(reward, -1.0, 1.0))

    def check_done(self):
        return self.state["ball_x"] <= 0 or self.state["ball_x"] >= self.screen_width

    def log_state(self, action, reward):
        """
        Log the current state, action, and reward for debugging or analysis.
        Args:
            action (int): The action taken.
            reward (float): The reward received.
        """
        log_entry = {
            "timestamp": time.time(),
            "state": self.state.copy(),
            "action": action,
            "reward": reward,
        }
        self.log.append(log_entry)
