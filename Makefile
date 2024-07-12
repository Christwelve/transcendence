help:
	@echo "Usage: make <target>"
	@echo "Targets:"
	@echo "  build          Build Docker images"
	@echo "  up             Start Docker containers"
	@echo "  down           Stop Docker containers"
	@echo "  logs           Show logs of Docker containers"
	@echo "  clean          Remove Docker volumes and networks"

up:
	docker-compose up --build -d

down:
	docker-compose down

logs:
	docker-compose logs -f

clean:
	docker-compose down --rmi all

delete: 
	docker-compose down -v --remove-orphans
	docker-compose down --rmi all
	docker-compose rm -f

.PHONY: help up down logs clean delete
