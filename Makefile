.PHONY: help build up down restart logs logs-backend logs-web ps clean migrate shell-backend shell-web test

.DEFAULT_GOAL := help

help: ## Display this help message
	@echo "Workforce Manager - Available Commands:"
	@echo ""
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

build: ## Build all Docker containers
	docker compose build

up: ## Start all services in the background
	docker compose up --build

down: ## Stop all running services
	docker compose down

restart: ## Restart all services
	docker compose restart

logs: ## View live logs from all services
	docker compose logs -f

logs-backend: ## View live logs from backend service
	docker compose logs -f backend

logs-web: ## View live logs from web service
	docker compose logs -f web


migrate: ## Run Alembic database migrations in backend container
	docker compose exec backend alembic upgrade head

shell-backend: ## Open an interactive shell inside the backend container
	docker compose exec backend /bin/bash

shell-web: ## Open an interactive shell inside the web container
	docker compose exec web /bin/sh

clean: ## Stop services and remove containers, networks, and persistent volumes
	docker compose down -v

test: ## Run backend unit tests inside container
	docker compose exec backend pytest

