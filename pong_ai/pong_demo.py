import pygame
import random
import time
import os
import json


# Path for storing game state data
STATE_FILE_PATH = "./data/game_state.json"

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
BALL_SPEED = 4
BALL_MAX_SPEED = 10
UPDATE_INTERVAL = 1
last_update_time = 0

class Paddle:
    def __init__(self, x, y):
        self.rect = pygame.Rect(x, y, PADDLE_WIDTH, PADDLE_HEIGHT)
        self.speed = 6

    def move(self, up=True):
        self.rect.y += -self.speed if up else self.speed
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
        # Center the ball and reset speed with a random direction
        self.rect.center = (WIDTH // 2, HEIGHT // 2)
        self.speed_x = BALL_SPEED * random.choice((1, -1))
        self.speed_y = BALL_SPEED * random.choice((1, -1))

    def increase_speed(self):
        # Increase speed with a cap at BALL_MAX_SPEED
        if abs(self.speed_x) < BALL_MAX_SPEED:
            self.speed_x *= 1.1
        if abs(self.speed_y) < BALL_MAX_SPEED:
            self.speed_y *= 1.1

    def check_collision(self, paddle):
        if self.rect.colliderect(paddle.rect):
            # Adjust angle based on hit location and reverse direction
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
    ensure_directory_exists()
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

        state = load_game_state()
        if "ai_paddle" in state:
            ai_paddle.rect.y = state["ai_paddle"]

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False

        keys = pygame.key.get_pressed()
        if keys[pygame.K_UP]:
            player_paddle.move(up=True)
        if keys[pygame.K_DOWN]:
            player_paddle.move(up=False)

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
