#!/bin/sh
set -eu
cd "$(dirname "$0")/.."

if docker compose version >/dev/null 2>&1; then
  exec docker compose up -d --build
fi

docker-compose build
ids=$(docker ps -aq --filter name=sample-proposal || true)
if [ -n "$ids" ]; then
  docker rm -f $ids
fi
docker-compose up -d
