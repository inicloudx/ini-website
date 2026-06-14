#!/bin/sh
set -e
# The db volume is mounted root-owned; fix it before dropping to appuser
mkdir -p /app/db
chown appuser:appgroup /app/db
exec gosu appuser "$@"
