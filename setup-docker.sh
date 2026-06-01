#!/bin/bash

echo "🚀 Setting up Docker for Medical Surveillance System..."

# 1. Create Dockerfile
cat > Dockerfile << 'DOCKERFILE'
FROM node:18-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --only=production

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
RUN mkdir .next
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY healthcheck.js ./
RUN chmod +x healthcheck.js
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node healthcheck.js
CMD ["node", "server.js"]
DOCKERFILE
echo "✅ Created Dockerfile"

# 2. Create Dockerfile.dev
cat > Dockerfile.dev << 'DOCKERFILEDEV'
FROM node:18-alpine
WORKDIR /app
RUN apk add --no-cache curl
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1
CMD ["npm", "run", "dev"]
DOCKERFILEDEV
echo "✅ Created Dockerfile.dev"

# 3. Create healthcheck.js
cat > healthcheck.js << 'HEALTHCHECK'
const http = require('http');
const options = {
  hostname: 'localhost',
  port: process.env.PORT || 3000,
  path: '/api/health',
  method: 'GET',
  timeout: 5000
};
const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    console.log('Health check passed');
    process.exit(0);
  } else {
    console.error(\`Health check failed: \${res.statusCode}\`);
    process.exit(1);
  }
});
req.on('error', (err) => {
  console.error('Health check error:', err.message);
  process.exit(1);
});
req.on('timeout', () => {
  console.error('Health check timeout');
  req.destroy();
  process.exit(1);
});
req.end();
HEALTHCHECK
echo "✅ Created healthcheck.js"

# 4. Create docker-compose.yml
cat > docker-compose.yml << 'COMPOSE'
version: '3.8'
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    container_name: medsurve-app-dev
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - NEXT_PUBLIC_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
      - NEXT_PUBLIC_APPWRITE_PROJECT_ID=693d3ac6003091b9ba43
      - NEXT_PUBLIC_APPWRITE_DATABASE_ID=medsurv_db
      - NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID=medsurv_storage
      - APPWRITE_API_KEY=standard_acc06a08ae7c23f5f95005bb22362c2ef4858878d0f773631f31249d37f71a1c048126ba7071cf6cfe4538f2205abf2f27df9471f42733c24bd90e6dd3a1db2b26601dd7f5c4c2b7a04b1be9d12616ebe414044c03700df2cab2b318866ef7e066af6c538b070d0202364ddffd8ec655020f63c5b4a83dd175428845215ab66a
      - ENCRYPTION_KEY=dev_key_change_this_in_production
      - BREVO_API_KEY=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
      - EMAIL_FROM=nelisatest@gmail.com
      - EMAIL_FROM_NAME=MedWatch
      - NEXT_PUBLIC_APP_URL=http://localhost:3000
      - ENABLE_LOGGING=true
    volumes:
      - .:/app
      - /app/node_modules
      - /app/.next
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3
COMPOSE
echo "✅ Created docker-compose.yml"

# 5. Create Makefile
cat > Makefile << 'MAKEFILE'
.PHONY: dev build down logs clean shell health

dev:
	docker-compose up -d
	@echo "✅ App running at http://localhost:3000"

build:
	docker build -t medsurve:latest .

down:
	docker-compose down

logs:
	docker-compose logs -f app

clean:
	docker-compose down -v
	docker system prune -f

shell:
	docker-compose exec app sh

health:
	curl -f http://localhost:3000/api/health && echo "✅ Health check passed" || echo "❌ Health check failed"

restart:
	docker-compose restart app

status:
	docker-compose ps
MAKEFILE
echo "✅ Created Makefile"

# 6. Create .dockerignore
cat > .dockerignore << 'IGNORE'
.git
.gitignore
node_modules
.next
.env
.env.local
.env.production
.env.development
logs
*.log
.DS_Store
IGNORE
echo "✅ Created .dockerignore"

# 7. Create health endpoint if it doesn't exist
if [ ! -f "app/api/health/route.ts" ]; then
  mkdir -p app/api/health
  cat > app/api/health/route.ts << 'HEALTHROUTE'
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'medical-surveillance-system',
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
}
HEALTHROUTE
  echo "✅ Created health endpoint"
else
  echo "ℹ️  Health endpoint already exists"
fi

echo ""
echo "🎉 Docker setup complete!"
echo ""
echo "Next steps:"
echo "1. Run: make dev          # Start the application"
echo "2. Open: http://localhost:3000"
echo "3. Run: make health       # Check if it's working"
echo "4. Run: make logs         # View logs"
echo ""
