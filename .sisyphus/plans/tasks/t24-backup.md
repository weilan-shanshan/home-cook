# Task 24 — 备份脚本

> **Wave**: 4 | **可并行**: 与 T21, T22, T23 同时开始 | **预估**: 15 分钟
>
> **依赖**: T04（COS 环境变量配置）
>
> **后续任务等我完成**: 无直接后续

---

## 🔴 人工信息检查点

> 本任务**无需人工信息**，可直接执行。
>
> 备份脚本中使用的 COS 配置（bucket, region）来自 T04 的 `.env`，但脚本本身只是模板，不需要实际配置。
> 实际 cron 配置在部署阶段（T25）执行。

---

## 目标

创建 SQLite 数据库备份脚本，使用 sqlite3 安全备份 + coscli 上传到 COS，保留最近 30 天备份。

## 需要创建的文件

### `backend/scripts/backup.sh`

完全参照技术方案第 9.4 节的脚本：

```bash
#!/bin/bash
set -euo pipefail

DB_PATH="/data/private-chef/data/cook.db"
BACKUP_DIR="/data/private-chef/backups"
COS_BUCKET="cos://your-bucket"  # 从环境变量或 .env 读取
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/cook_$DATE.db"

# 1. 安全备份（不锁表）
mkdir -p "$BACKUP_DIR"
sqlite3 "$DB_PATH" ".backup '$BACKUP_FILE'"

# 2. 上传到 COS
coscli cp "$BACKUP_FILE" "$COS_BUCKET/backups/cook_$DATE.db"

# 3. 清理：保留最近 30 天
find "$BACKUP_DIR" -name "cook_*.db" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE"
```

### 确保文件属性

- `chmod +x backend/scripts/backup.sh`

### Cron 配置说明（注释形式）

在脚本头部或单独文件中注明：
```bash
# Cron: 每天凌晨 3 点执行
# 0 3 * * * /data/private-chef/backend/scripts/backup.sh >> /data/private-chef/logs/backup.log 2>&1
```

## 技术方案参考

- `私厨-技术方案.md` 第 544-568 行 — 完整备份脚本

## 验收标准

- [ ] `backend/scripts/backup.sh` 可执行（chmod +x）
- [ ] 脚本包含三步: sqlite3 .backup → coscli cp → find -delete
- [ ] 保留 30 天备份（find -mtime +30 -delete）
- [ ] 有 cron 配置说明

## 禁止事项

- ❌ 不使用 cp/rsync 备份 SQLite（会导致数据损坏），必须用 sqlite3 `.backup`

## QA 场景

```
Scenario: Backup script has correct structure
  Tool: Bash
  Steps:
    1. cat backend/scripts/backup.sh
    2. grep ".backup" backend/scripts/backup.sh
    3. grep "coscli" backend/scripts/backup.sh
    4. grep "\-mtime +30" backend/scripts/backup.sh
    5. test -x backend/scripts/backup.sh
  Expected Result: Script contains backup, upload, cleanup commands and is executable
  Evidence: .sisyphus/evidence/task-24-backup.txt
```

## 提交

- **Group**: 与 T22 一起提交
- **Message**: `feat(infra): add PWA config and backup script`
