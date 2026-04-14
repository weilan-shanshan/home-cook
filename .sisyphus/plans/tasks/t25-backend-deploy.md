# Task 25 — 后端部署配置（PM2 + Cloudflare Tunnel）

> **Wave**: 5 | **可并行**: 与 T26 同时开始 | **预估**: 25 分钟
>
> **依赖**: T21（后端集成完成）
>
> **后续任务等我完成**: 无

---

## 🔴 人工信息检查点

> ⚠️ **需要以下信息，请在执行前准备好，执行到相关步骤时会暂停提示：**
>
> ### 1. 服务器 SSH 信息
> - **服务器 IP**: 你的云服务器公网 IP
> - **SSH 用户名**: 通常是 `root`
> - **SSH 端口**: 通常是 `22`
>
> ### 2. 域名信息
> - **API 域名**: 例如 `api.yourdomain.top`（用于 Cloudflare Tunnel 配置）
>
> ### 3. Cloudflare Tunnel
> - **Tunnel Token**: Cloudflare Zero Trust 中创建 Tunnel 后获得
> - 获取方式: Cloudflare Dashboard → Zero Trust → Networks → Tunnels → Create
>
> ---
>
> **如果还没有这些信息**:
> - 服务器: 先在云服务商购买轻量服务器
> - 域名: 先在 Cloudflare 注册并添加域名
> - 本任务可以先创建配置模板，实际部署时再填入

---

## 目标

创建后端部署所需的所有配置文件：PM2 进程管理、Cloudflare Tunnel 配置模板、部署脚本。

## 需要创建的文件

### 1. `backend/ecosystem.config.js` — PM2 配置

```javascript
module.exports = {
  apps: [{
    name: 'private-chef-api',
    script: 'dist/index.js',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    error_file: '/data/private-chef/logs/error.log',
    out_file: '/data/private-chef/logs/out.log',
    time: true,
  }],
}
```

### 2. `backend/cloudflared-config.yml` — Cloudflare Tunnel 配置模板

```yaml
# Cloudflare Tunnel 配置
# 使用方式: cloudflared tunnel --config cloudflared-config.yml run
tunnel: YOUR_TUNNEL_ID  # ← 替换为你的 Tunnel ID
credentials-file: /root/.cloudflared/YOUR_TUNNEL_ID.json

ingress:
  - hostname: api.yourdomain.top  # ← 替换为你的 API 域名
    service: http://localhost:3000
  - service: http_status:404
```

### 3. `backend/scripts/deploy.sh` — 部署脚本

```bash
#!/bin/bash
set -euo pipefail

# 使用方式: ./scripts/deploy.sh
# 在本地执行，SSH 到服务器完成部署

SERVER="root@YOUR_SERVER_IP"  # ← 替换
REMOTE_DIR="/data/private-chef"

ssh $SERVER << 'ENDSSH'
  cd /data/private-chef
  git pull origin main
  cd backend
  npm install --production
  npm run build
  pm2 restart ecosystem.config.js --env production
  echo "Deploy completed at $(date)"
ENDSSH
```

### 4. 更新 `backend/package.json` — 添加脚本

```json
{
  "scripts": {
    "start": "pm2 start ecosystem.config.js --env production",
    "build": "tsc",
    "dev": "tsx watch src/index.ts"
  }
}
```

## 技术方案参考

- `私厨-技术方案.md` 第 499-528 行 — 服务器初始化和后端部署
- `私厨-技术方案.md` 第 129-138 行 — 部署方案

## 验收标准

- [ ] `ecosystem.config.js` 可被 Node.js 正确解析
- [ ] Cloudflare Tunnel 配置模板包含占位符和注释说明
- [ ] `deploy.sh` 可执行（chmod +x）
- [ ] package.json 含 start/build/dev 脚本

## 禁止事项

- ❌ 不在配置文件中硬编码真实密码/token
- ❌ 使用占位符（YOUR_XXX）标记需替换的值

## QA 场景

```
Scenario: PM2 config valid
  Tool: Bash
  Steps:
    1. cd backend && node -e "const c=require('./ecosystem.config.js'); console.log(JSON.stringify(c))"
    2. Assert output contains "private-chef-api"
    3. Assert output contains "dist/index.js"
  Expected Result: PM2 config parseable and correct
  Evidence: .sisyphus/evidence/task-25-pm2.txt
```

## 提交

- **Group**: 与 T26 一起提交
- **Message**: `feat(deploy): add PM2 ecosystem and Cloudflare config`
