#!/bin/sh
set -e

# Fix ownership of mounted volumes (Docker names volumes as root by default)
mkdir -p /app/db /app/staticfiles /app/media
chown -R appuser:appgroup /app/db /app/staticfiles /app/media

# Populate the static_volume with the latest collected files on every start
gosu appuser python manage.py collectstatic --noinput --clear

exec gosu appuser "$@"
