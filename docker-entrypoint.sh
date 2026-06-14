#!/bin/sh
set -e
# Fix ownership of db volume recursively (files may be created as root by
# management commands run via docker compose exec, which defaults to root)
mkdir -p /app/db
chown -R appuser:appgroup /app/db
exec gosu appuser "$@"
