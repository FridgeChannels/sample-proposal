#!/bin/sh
set -eu
cd "$(dirname "$0")/.."

# Enable BuildKit only when buildx is available; older hosts use the legacy builder.
if docker buildx version >/dev/null 2>&1; then
  export DOCKER_BUILDKIT=1
  export COMPOSE_DOCKER_CLI_BUILD=1
else
  export DOCKER_BUILDKIT=0
  export COMPOSE_DOCKER_CLI_BUILD=0
fi

if docker compose version >/dev/null 2>&1; then
  exec docker compose up -d --build
fi

docker-compose build
ids=$(docker ps -aq --filter name=sample-proposal || true)
if [ -n "$ids" ]; then
  docker rm -f $ids
fi
docker-compose up -d
