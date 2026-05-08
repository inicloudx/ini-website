#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  iNiXR Technologies - Oracle Cloud Free Tier Deploy Script
#  Run this on your Oracle Cloud VM after SSH login
# ═══════════════════════════════════════════════════════════════
set -e

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   iNiXR Technologies - Deploy Script     ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── 1. Pull latest code ────────────────────────────────────────
echo "▶ Pulling latest code..."
git pull origin main

# ── 2. Ensure .env exists ──────────────────────────────────────
if [ ! -f .env ]; then
    echo "❌  .env file not found! Copy .env.example to .env and fill in values."
    exit 1
fi

# ── 3. Build & restart containers ────────────────────────────
echo "▶ Building Docker images..."
docker compose build --no-cache

echo "▶ Starting services..."
docker compose up -d

echo "▶ Running database migrations..."
docker compose exec web python manage.py migrate --noinput

echo ""
echo "✅  Deployment complete!"
echo "   Site running at: http://$(curl -s ifconfig.me)"
echo ""
