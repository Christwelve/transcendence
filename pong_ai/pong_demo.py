import pygame
import random
import time
import os
import json
import numpy as np
from tensorflow.keras.models import load_model

STATE_FILE_PATH = "./game_state.json"

def ensure_directory_exists():
    os.makedirs(os.path.dirname(STATE_FILE_PATH), exist_ok=True)

pygame.init()

# Screen setup
WIDTH, HEIGHT = 800, 400
screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Pong Demo")

WHITE = (255, 255, 255)
BLACK = (0, 0, 0)

# Paddle and ball settings
PADDLE_WIDTH, PADDLE_HEIGHT = 10, 80
BALL_SIZE = 20
BALL_SPEED = 6
BALL_MAX_SPEED = 10
PADDLE_SPEED = 6
UPDATE_INTERVAL = 1
last_update_time = 0

# Load AI model
actor_model_path = os.path.join("models", "best_actor.keras")
try:
    actor_model = load_model(actor_model_path)
    print("Actor model loaded successfully!")
except Exception as e:
    print(f"Error loading actor model: {e}")
    actor_model = None

class Paddle:
    def __init__(self, x, y):
        self.rect = pygame.Rect(x, y, PADDLE_WIDTH, PADDLE_HEIGHT)

    def move(self, up=True):
        self.rect.y += -PADDLE_SPEED if up else PADDLE_SPEED
        self.rect.y = max(0, min(self.rect.y, HEIGHT - PADDLE_HEIGHT))

    def move_with_velocity(self, velocity):
        if isinstance(velocity, np.ndarray):
            velocity = velocity.item()
        self.rect.y += velocity
        self.rect.y = max(0, min(self.rect.y, HEIGHT - PADDLE_HEIGHT))

    def draw(self, screen):
        pygame.draw.rect(screen, WHITE, self.rect)


class Ball:
    def __init__(self):
        self.rect = pygame.Rect(WIDTH // 2, HEIGHT // 2, BALL_SIZE, BALL_SIZE)
        self.speed_x = BALL_SPEED * random.choice((1, -1))
        self.speed_y = BALL_SPEED * random.choice((1, -1))

    def move(self):
        self.rect.x += self.speed_x
        self.rect.y += self.speed_y

        # Bounce off the top or bottom
        if self.rect.top <= 0 or self.rect.bottom >= HEIGHT:
            self.speed_y *= -1

        # Reset if ball goes past left or right edge
        if self.rect.left <= 0 or self.rect.right >= WIDTH:
            self.reset_position()

    def reset_position(self):
        self.rect.center = (WIDTH // 2, HEIGHT // 2)
        self.speed_x = BALL_SPEED * random.choice((1, -1))
        self.speed_y = BALL_SPEED * random.choice((1, -1))

    def increase_speed(self):
        if abs(self.speed_x) < BALL_MAX_SPEED:
            self.speed_x *= 1.1
        if abs(self.speed_y) < BALL_MAX_SPEED:
            self.speed_y *= 1.1

    def check_collision(self, paddle):
        if self.rect.colliderect(paddle.rect):
            offset = (self.rect.centery - paddle.rect.centery) / (PADDLE_HEIGHT / 2)
            self.speed_y = BALL_SPEED * offset
            self.speed_x *= -1
            self.increase_speed()

    def draw(self, screen):
        pygame.draw.ellipse(screen, WHITE, self.rect)


player_paddle = Paddle(WIDTH - 20, HEIGHT // 2 - PADDLE_HEIGHT // 2)
ai_paddle = Paddle(10, HEIGHT // 2 - PADDLE_HEIGHT // 2)
ball = Ball()
game_state = {}

def get_normalized_state():
    return np.array([
        ai_paddle.rect.y / HEIGHT,          # AI paddle position
        ball.rect.x / WIDTH,               # Ball x position
        ball.rect.y / HEIGHT,              # Ball y position
        ball.speed_x / BALL_MAX_SPEED,     # Ball x speed
        ball.speed_y / BALL_MAX_SPEED      # Ball y speed
    ], dtype=np.float32).reshape(1, -1)

def update_game_state():
    global game_state
    game_state = {
        "player_paddle": player_paddle.rect.y,
        "ai_paddle": ai_paddle.rect.y,
        "ball": (ball.rect.x, ball.rect.y),
        "ball_speed": (ball.speed_x, ball.speed_y),
        "ball_missed": False
    }

def save_game_state():
    if not os.path.exists(STATE_FILE_PATH):
        update_game_state()  
    with open(STATE_FILE_PATH, "w") as f:
        json.dump(game_state, f)

def timed_update():
    global last_update_time
    current_time = time.time()
    if current_time - last_update_time >= UPDATE_INTERVAL:
        update_game_state()
        save_game_state()
        last_update_time = current_time

def load_game_state():
    if os.path.exists(STATE_FILE_PATH):
        with open(STATE_FILE_PATH, "r") as f:
            return json.load(f)
    return {}

# Main game loop
if __name__ == "__main__":
    clock = pygame.time.Clock()
    running = True
    while running:
        screen.fill(BLACK)

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False

        keys = pygame.key.get_pressed()
        if keys[pygame.K_UP]:
            player_paddle.move(up=True)
        if keys[pygame.K_DOWN]:
            player_paddle.move(up=False)

        if actor_model:
            state = get_normalized_state()
            velocity = actor_model.predict(state, verbose=0)[0][0]
            velocity += np.random.normal(0, 0.1)
            velocity = np.clip(velocity, -1, 1) * PADDLE_SPEED
            ai_paddle.move_with_velocity(velocity)

        ball.move()
        if ball.rect.left < 0:
            game_state['ball_missed'] = True
            ball.reset_position()
        else:
            game_state['ball_missed'] = False

        timed_update()
        ball.check_collision(player_paddle)
        ball.check_collision(ai_paddle)

        player_paddle.draw(screen)
        ai_paddle.draw(screen)
        ball.draw(screen)

        pygame.display.flip()
        clock.tick(60)

    pygame.quit()
