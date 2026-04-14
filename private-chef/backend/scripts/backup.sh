#!/bin/bash
set -euo pipefail

# Cron: 0 3 * * * /data/private-chef/backend/scripts/backup.sh >> /data/private-chef/logs/backup.log 2>&1

DB_PATH="${DATABASE_PATH:-/data/private-chef/data/cook.db}"
BACKUP_DIR="${BACKUP_DIR:-/data/private-chef/backups}"
COS_BUCKET="${COS_BUCKET:-weilan-1254036222}"
COS_REGION="${COS_REGION:-ap-beijing}"
COS_PREFIX="${COS_PREFIX:-backups}"

DATE="$(date +%Y%m%d_%H%M%S)"
BACKUP_FILE="$BACKUP_DIR/cook_$DATE.db"
COS_TARGET="cos://${COS_BUCKET}/${COS_PREFIX}/cook_$DATE.db"

mkdir -p "$BACKUP_DIR"
sqlite3 "$DB_PATH" ".backup '$BACKUP_FILE'"
coscli cp "$BACKUP_FILE" "$COS_TARGET"
find "$BACKUP_DIR" -name "cook_*.db" -mtime +30 -delete

printf 'Backup completed: %s (COS region: %s)\n' "$BACKUP_FILE" "$COS_REGION"
