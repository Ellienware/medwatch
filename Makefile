.PHONY: dev build down logs clean shell health

dev:
	docker compose up -d
	@echo "✅ App running at http://localhost:3000"

build:
	docker build -t medsurve:latest .

down:
	docker compose down

logs:
	docker compose logs -f app

clean:
	docker compose down -v
	docker system prune -f

shell:
	docker compose exec app sh

health:
	curl -f http://localhost:3000/api/health && echo "✅ Health check passed" || echo "❌ Health check failed"

restart:
	docker compose restart app

status:
	docker compose ps

test:
	docker compose exec app npm run build
