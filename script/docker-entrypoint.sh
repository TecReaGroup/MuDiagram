#!/bin/sh
set -e

DATA_ROOT=/app/backend/data

# Bind mounts keep the host's ownership, which the unprivileged node user usually cannot write.
# Fix it as root on every start, then drop privileges (same pattern as the official postgres/redis images).
if [ "$(id -u)" = '0' ]; then
  mkdir -p "$DATA_ROOT/log" "$DATA_ROOT/project" "$DATA_ROOT/folder" "$DATA_ROOT/setting"
  chown -R node:node "$DATA_ROOT"
  exec su-exec node "$@"
fi

exec "$@"
