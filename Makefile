.PHONY: infra-up infra-down infra-logs smoke

## Start local infrastructure (Postgres + Redis) with health checks
infra-up:
	docker compose up -d postgres redis
	@echo "Waiting for services to become healthy..."
	@docker compose ps

## Stop local infrastructure
infra-down:
	docker compose down

## Stream logs from local infrastructure services
infra-logs:
	docker compose logs -f postgres redis

## Run the API smoke test against the local /health endpoint
smoke:
	@bash scripts/smoke.sh
