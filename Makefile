help:
	@echo "Usage: make <target>"
	@echo "Targets:"
	@echo "  build          Build Docker images"
	@echo "  up             Start Docker containers"
	@echo "  down           Stop Docker containers"
	@echo "  logs           Show logs of Docker containers"
	@echo "  clean          Remove Docker volumes and networks"
	@echo "  test           Run tests"

build:
	docker-compose up --build -d

up:
	docker-compose up -d

down:
	docker-compose down

logs:
	docker-compose logs -f

clean:
	docker-compose down -v --remove-orphans
	docker-compose rm -f
	docker-compose down --rmi all

test:
	docker-compose run backend

.PHONY: help build up down logs clean test
