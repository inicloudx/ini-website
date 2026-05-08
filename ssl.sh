#!/bin/bash
# iNiXR SSL Certificate Setup - Run this on Oracle Cloud server
set -e

DOMAIN="inixr.com"
WWW="www.inixr.com"
EMAIL="inicloudx@gmail.com"

echo "Getting free SSL certificate for $DOMAIN and $WWW ..."

docker compose run --rm --entrypoint "" certbot \
  certbot certonly \
  --webroot \
  -w /var/www/certbot \
  -d "$DOMAIN" \
  -d "$WWW" \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email \
  --verbose

echo "SSL certificate obtained successfully!"
