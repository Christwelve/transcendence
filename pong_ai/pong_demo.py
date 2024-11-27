import pygame
import random
import time
import os
import json
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model

STATE_FILE_PATH = "./game_state.json"

# Configuration
CONFIG = {
    "WIDTH": 800,
    "HEIGHT": 400,
    "PADDLE_WIDTH": 10,
    "PADDLE_HEIGHT": 80,
    "BALL_SIZE": 20,
    "BALL_SPEED": 8,
    "BALL_MAX_SPEED": 10,
    "PADDLE_SPEED": 10,
    "UPDATE_INTERVAL": 1,
    "SEED": 42,
    "GAME_SPEED": 60,
    "SCORING": {
        "MAX_SCORE": 10
    },
    "COLORS": {
        "WHITE": (255, 255, 255),
        "BLACK": (0, 0, 0)
    },
    "AI": {
        "SMOOTHING_ALPHA": 0.0, 
        "MODEL_PATH": "./models/best_actor.keras"
    },
    "DEBUG": {
        "PRINT_NORMALIZED_STATE": False,
        "SHOW_BALL_SPEED": False
    }
}

random.seed(CONFIG["SEED"])

# Initialize pygame
pygame.init()
screen = pygame.display.set_mode((CONFIG["WIDTH"], CONFIG["HEIGHT"]))
pygame.display.set_caption("Pong Demo")
COLORS = CONFIG["COLORS"]

# Load AI model
actor_model = None
try:
    actor_model = load_model(CONFIG["AI"]["MODEL_PATH"])
    print("Actor model loaded successfully!")
except Exception as e:
    print(f"Error loading actor model: {e}")

class Paddle:
    def __init__(self, x, y, config):
        self.rect = pygame.Rect(x, y, config["PADDLE_WIDTH"], config["PADDLE_HEIGHT"])
        self.speed = config["PADDLE_SPEED"]
        self.velocity = 0  # Initial velocity

    def move(self, up=True):
        direction = -1 if up else 1
        self.rect.y += direction * self.speed
        self.rect.y = max(0, min(self.rect.y, CONFIG["HEIGHT"] - CONFIG["PADDLE_HEIGHT"]))

    def move_with_velocity(self, velocity):
        if isinstance(velocity, np.ndarray):
            velocity = velocity.item()
        else:
            velocity = float(velocity)

        max_speed = CONFIG["PADDLE_SPEED"]
        velocity = max(-max_speed, min(max_speed, velocity))
        self.rect.y += velocity
        self.rect.y = max(0, min(self.rect.y, CONFIG["HEIGHT"] - CONFIG["PADDLE_HEIGHT"]))

    def draw(self, screen):
        pygame.draw.rect(screen, COLORS["WHITE"], self.rect)

class Ball:
    def __init__(self, config):
        self.rect = pygame.Rect(config["WIDTH"] // 2, config["HEIGHT"] // 2, config["BALL_SIZE"], config["BALL_SIZE"])
        self.speed_x = config["BALL_SPEED"] * random.choice((1, -1))
        self.speed_y = config["BALL_SPEED"] * random.choice((1, -1))
        self.max_speed = config["BALL_MAX_SPEED"]

    def move(self):
        self.rect.x += self.speed_x
        self.rect.y += self.speed_y
        if self.rect.top <= 0 or self.rect.bottom >= CONFIG["HEIGHT"]:
            self.speed_y *= -1

    def reset_position(self):
        self.rect.center = (CONFIG["WIDTH"] // 2, CONFIG["HEIGHT"] // 2)
        self.speed_x = CONFIG["BALL_SPEED"] * random.choice((1, -1))
        self.speed_y = CONFIG["BALL_SPEED"] * random.choice((1, -1))

    def increase_speed(self):
        self.speed_x += 0.1 * np.sign(self.speed_x)
        self.speed_y += 0.1 * np.sign(self.speed_y)
        self.speed_x = max(-self.max_speed, min(self.speed_x, self.max_speed))
        self.speed_y = max(-self.max_speed, min(self.speed_y, self.max_speed))

    def check_collision(self, paddle):
        if self.rect.colliderect(paddle.rect):
            offset = (self.rect.centery - paddle.rect.centery) / (CONFIG["PADDLE_HEIGHT"] / 2)
            self.speed_y = CONFIG["BALL_SPEED"] * offset
            self.speed_x *= -1
            self.increase_speed()

    def draw(self, screen):
        pygame.draw.ellipse(screen, COLORS["WHITE"], self.rect)

def get_normalized_state(ai_paddle, ball):
    # Corrected normalization for ai_paddle position
    normalized_paddle_y = (ai_paddle.rect.y / (CONFIG["HEIGHT"] - CONFIG["PADDLE_HEIGHT"])) * 2 - 1
    # Use ball's center position for normalization
    normalized_ball_x = (ball.rect.centerx / CONFIG["WIDTH"]) * 2 - 1
    normalized_ball_y = (ball.rect.centery / CONFIG["HEIGHT"]) * 2 - 1
    normalized_ball_speed_x = ball.speed_x / CONFIG["BALL_MAX_SPEED"]
    normalized_ball_speed_y = ball.speed_y / CONFIG["BALL_MAX_SPEED"]

    # Debugging prints
    if CONFIG["DEBUG"]["PRINT_NORMALIZED_STATE"]:
        print("Normalized State:")
        print(f"Paddle Y: {normalized_paddle_y}")
        print(f"Ball X: {normalized_ball_x}")
        print(f"Ball Y: {normalized_ball_y}")
        print(f"Ball Speed X: {normalized_ball_speed_x}")
        print(f"Ball Speed Y: {normalized_ball_speed_y}")

    return np.array([
        normalized_paddle_y,
        normalized_ball_x,
        normalized_ball_y,
        normalized_ball_speed_x,
        normalized_ball_speed_y
    ], dtype=np.float32).reshape(1, -1)

def save_game_state(state):
    with open(STATE_FILE_PATH, "w") as f:
        json.dump(state, f)

def update_game_state(ai_paddle, ball):
    return {
        "ai_paddle": ai_paddle.rect.y,
        "ball": (ball.rect.x, ball.rect.y),
        "ball_speed": (ball.speed_x, ball.speed_y)
    }

action_mapping = {0: -1, 1: 0, 2: 1}

# Main game loop
if __name__ == "__main__":
    clock = pygame.time.Clock()
    player_paddle = Paddle(CONFIG["WIDTH"] - 20, CONFIG["HEIGHT"] // 2 - CONFIG["PADDLE_HEIGHT"] // 2, CONFIG)
    ai_paddle = Paddle(10, CONFIG["HEIGHT"] // 2 - CONFIG["PADDLE_HEIGHT"] // 2, CONFIG)
    ball = Ball(CONFIG)

    running = True
    while running:
        screen.fill(COLORS["BLACK"])
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False

        # Player paddle movement
        keys = pygame.key.get_pressed()
        if keys[pygame.K_UP]:
            player_paddle.move(up=True)
        if keys[pygame.K_DOWN]:
            player_paddle.move(up=False)

        # AI paddle movement
        if actor_model:
            state = get_normalized_state(ai_paddle, ball)
            # Get logits from the model
            logits = actor_model.predict(state, verbose=0)
            # Convert logits to action probabilities
            action_probs = tf.nn.softmax(logits).numpy()[0]
            # Select the action with the highest probability
            action_idx = np.argmax(action_probs)
            # Map action index to actual action
            action = action_mapping[action_idx]

            # Move the paddle based on the action
            if action == -1:
                ai_paddle.move(up=True)
            elif action == 1:
                ai_paddle.move(up=False)
            else:
                # Stay idle
                pass

        # Ball movement
        ball.move()
        if ball.rect.left <= 0 or ball.rect.right >= CONFIG["WIDTH"]:
            ball.reset_position()

        ball.check_collision(player_paddle)
        ball.check_collision(ai_paddle)

        game_state = update_game_state(ai_paddle, ball)
        if time.time() % CONFIG["UPDATE_INTERVAL"] < 0.02:
            save_game_state(game_state)

        # Drawing
        player_paddle.draw(screen)
        ai_paddle.draw(screen)
        ball.draw(screen)
        pygame.display.flip()
        clock.tick(CONFIG["GAME_SPEED"])

    pygame.quit()