#!/bin/bash
set -euo pipefail

# Deploy script for the remote backend host.
# Current remote backend path: ubuntu@101.42.108.88:/data/private-chef/backend/

SERVER_USER="ubuntu"
SERVER_HOST="101.42.108.88"
SERVER_PORT="22"
REMOTE_DIR="/data/private-chef"

ssh -p "$SERVER_PORT" "${SERVER_USER}@${SERVER_HOST}" 'bash -s' <<'EOF'
set -euo pipefail

REMOTE_DIR="/data/private-chef"
APP_DIR="$REMOTE_DIR/backend"

cd "$REMOTE_DIR"
git pull --ff-only origin main

mkdir -p "$REMOTE_DIR/logs"

cd "$APP_DIR"
npm ci
npm run build
npm prune --omit=dev
pm2 startOrRestart ecosystem.config.cjs --env production --update-env

printf 'Deploy completed at %s\n' "$(date)"
EOF
