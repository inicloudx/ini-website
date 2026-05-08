#!/bin/bash
# iNiXR SSL Certificate Setup
set -e

DOMAIN="inixr.com"
WWW="www.inixr.com"
EMAIL="inicloudx@gmail.com"

echo "Getting free SSL certificate for $DOMAIN and $WWW ..."

# Run certbot directly with docker run (bypasses entrypoint issue)
docker run --rm \
  -v ini-website_certbot_certs:/etc/letsencrypt \
  -v ini-website_certbot_www:/var/www/certbot \
  certbot/certbot:latest certonly \
  --webroot \
  -w /var/www/certbot \
  -d "$DOMAIN" \
  -d "$WWW" \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email \
  --verbose

echo ""
echo "SSL certificate obtained! Now enabling HTTPS..."
