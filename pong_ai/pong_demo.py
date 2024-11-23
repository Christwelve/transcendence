import pygame
import random
import time
import os
import json
import numpy as np
from tensorflow.keras.models import load_model

STATE_FILE_PATH = "./game_state.json"

# Configuration
CONFIG = {
  "WIDTH": 800,
  "HEIGHT": 400,
  "PADDLE_WIDTH": 10,
  "PADDLE_HEIGHT": 80,
  "BALL_SIZE": 20,
  "BALL_SPEED": 6,
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
      "SMOOTHING_ALPHA": 0.8,
      "MODEL_PATH": "./models/best_actor.keras"
  },
  "DEBUG": {
      "PRINT_NORMALIZED_STATE": True,
      "SHOW_BALL_SPEED": False
  }
}

# Apply random seed for reproducibility
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
        self.smoothing_alpha = config["AI"]["SMOOTHING_ALPHA"]
        self.velocity = 0  # Smoothed velocity

    def move(self, up=True):
        direction = -1 if up else 1
        self.rect.y += direction * self.speed
        self.rect.y = max(0, min(self.rect.y, CONFIG["HEIGHT"] - CONFIG["PADDLE_HEIGHT"]))

    def move_with_velocity(self, velocity):
        self.velocity = self.smoothing_alpha * self.velocity + (1 - self.smoothing_alpha) * velocity
        self.rect.y += self.velocity
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


def get_normalized_state(ai_paddle, player_paddle, ball):
    return np.array([
        (ai_paddle.rect.y / CONFIG["HEIGHT"]) * 2 - 1,
        (player_paddle.rect.y / CONFIG["HEIGHT"]) * 2 - 1,
        (ball.rect.x / CONFIG["WIDTH"]) * 2 - 1,
        (ball.rect.y / CONFIG["HEIGHT"]) * 2 - 1,
        ball.speed_x / CONFIG["BALL_MAX_SPEED"],
        ball.speed_y / CONFIG["BALL_MAX_SPEED"]
    ], dtype=np.float32).reshape(1, -1)


def save_game_state(state):
    with open(STATE_FILE_PATH, "w") as f:
        json.dump(state, f)


def update_game_state(player_paddle, ai_paddle, ball):
    return {
        "player_paddle": player_paddle.rect.y,
        "ai_paddle": ai_paddle.rect.y,
        "ball": (ball.rect.x, ball.rect.y),
        "ball_speed": (ball.speed_x, ball.speed_y)
    }


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

        keys = pygame.key.get_pressed()
        if keys[pygame.K_UP]:
            player_paddle.move(up=True)
        if keys[pygame.K_DOWN]:
            player_paddle.move(up=False)

        if actor_model:
            state = get_normalized_state(ai_paddle, player_paddle, ball)
            if CONFIG["DEBUG"]["PRINT_NORMALIZED_STATE"]:
                    print(f"Normalized State: AI Paddle={state[0][0]:.3f}, "
                    f"Player Paddle={state[0][1]:.3f}, "
                    f"Ball X={state[0][2]:.3f}, Ball Y={state[0][3]:.3f}, "
                    f"Ball Speed X={state[0][4]:.3f}, Ball Speed Y={state[0][5]:.3f}")
            predicted_velocity = actor_model.predict(state, verbose=0)[0][0] * CONFIG["PADDLE_SPEED"]
            ai_paddle.move_with_velocity(predicted_velocity)

        ball.move()
        if ball.rect.left <= 0 or ball.rect.right >= CONFIG["WIDTH"]:
            ball.reset_position()

        ball.check_collision(player_paddle)
        ball.check_collision(ai_paddle)

        game_state = update_game_state(player_paddle, ai_paddle, ball)
        if time.time() % CONFIG["UPDATE_INTERVAL"] < 0.02:
            save_game_state(game_state)

        player_paddle.draw(screen)
        ai_paddle.draw(screen)
        ball.draw(screen)
        pygame.display.flip()
        clock.tick(CONFIG["GAME_SPEED"])

    pygame.quit()
