# Task 27 — 腾讯云一体化部署方案（前后端同服 + 自动部署）

> **Wave**: 6 | **可并行**: 否 | **预估**: 3-5 小时（执行阶段）
>
> **依赖**: T21（后端集成完成）、当前后端已在腾讯云通过 `systemd` 稳定运行、当前前端构建已成功
>
> **后续任务等我完成**: 可选的 Cloudflare 历史配置清理

---

## 当前状态

> ⛔ **本方案目前不具备执行条件，不是当前使用中的部署方案。**
>
> 当前前端仍使用 **Cloudflare Pages**，当前生产部署不应按本文直接执行。
>
> 本文档仅保留为“未来候选方案 / 条件满足后再评估”，不能视为当前主执行路径。

---

## 🔴 人工信息检查点

> ⚠️ 本任务当前只保留为候选执行方案，不立即改线上；且**目前不具备切换条件**。如未来重新启用，下阶段执行前，需要先补齐以下信息。

### 1. 域名与备案
- **主站域名**: 例如 `weilanshanshan.top`
- **API 域名策略**: 继续保留 `api.weilanshanshan.top`，或统一改为主站同源 `/api`
- **ICP备案状态**: 域名是否已完成可在中国大陆服务器上线所需备案
- **执行闸门**: 在真正切换到“腾讯云前后端直出”之前，必须由人工明确确认“备案已完成”

### 2. 腾讯云服务器信息
- **服务器公网 IP**
- **SSH 用户名**
- **SSH 认证方式**: 密码 / 密钥
- **当前后端 `systemd` 服务名**: 例如 `private-chef-api.service`

### 3. HTTPS 证书
- **证书来源**: 腾讯云 SSL / Let's Encrypt / 其他
- **证书路径**: 如部署在 Nginx，需要明确证书文件路径
- **证书续期方式**

### 4. 自动部署信息
- **Git 仓库地址**
- **默认部署分支**: `main` / `master` / 其他
- **GitHub Actions Secrets**:
  - `DEPLOY_HOST`
  - `DEPLOY_USER`
  - `DEPLOY_KEY`
  - `DEPLOY_PORT`（如非 22）

### 5. 前端上线目录
- **Nginx 静态目录根路径**: 例如 `/var/www/private-chef`
- **是否接受版本目录 + `current` 软链接切换**

---

## 目标

在未来条件满足时，将当前「后端在腾讯云、前端使用 Cloudflare Pages」的部署思路，调整为**腾讯云一体化部署**：

- 前端构建产物部署到腾讯云服务器，由 **Nginx** 托管
- 后端继续部署在腾讯云服务器，由 **systemd** 守护
- 生产流量优先走**同源 HTTPS**：
  - `https://主站域名/` → 前端 SPA
  - `https://主站域名/api/*` → Nginx 反代后端
- 建立前后端**自动部署**链路
- 明确回滚、验收、切换顺序，作为下阶段执行依据

---

## 当前已知状态

### 执行根目录约定
- **应用仓库根目录固定为**: `private-chef/`
- 本文中的仓库文件路径、CI 路径过滤、构建命令、部署脚本路径，均默认以 `private-chef/` 为项目根目录
- `.sisyphus/` 位于工作区根目录，只承担计划文档与证据输出职责，不作为应用代码目录

### 已完成
- 后端已经在腾讯云服务器稳定运行
- 当前后端由 `systemd` 常驻，而不是 PM2
- 当前后端健康检查可用
- 当前前端 `npm run build` 已成功
- 当前前端构建产物已可用于静态部署

### 现存文档假设
- `t25-backend-deploy.md` 仍以 **PM2 + Cloudflare Tunnel** 为主
- `t26-frontend-deploy.md` 仍以 **Cloudflare Pages** 为主
- 两份《私厨-技术方案.md》也仍保留 Cloudflare 为主路径的描述

### 本任务定位
- 本任务**不是立即执行迁移**
- 本任务当前仅作为**未来候选方案草案**保留
- 在目前阶段，`t26-frontend-deploy.md` 才是前端当前生效路径
- 本文档在当前阶段**不能视为主执行路径**

---

## 候选部署决策（Future Candidate Only）

### 候选方案：腾讯云同服部署

采用以下生产拓扑：

```text
用户浏览器
   │
   ▼
Nginx (腾讯云服务器, 443)
   ├── /                → 前端静态文件
   └── /api/*           → 反向代理到 127.0.0.1:3000
                           │
                           ▼
                    private-chef-api.service
```

### 为什么曾考虑这条路径
- 更符合“只需要中国大陆访问”的目标
- 生产链路最短，排障成本最低
- 前后端同源后，Cookie / CORS / 环境变量策略更简单
- 自动部署可直接围绕腾讯云服务器构建，不需要再维护 Pages / Tunnel 两条链路

### 当前实际策略
- **当前前端继续使用 Cloudflare Pages，且这是当前正式路径**
- 后端保持当前可用方案，避免提前切到“腾讯云前后端直出”路径
- 只有在未来人工明确确认“该方案重新启用且条件已具备”后，才进入腾讯云一体化切换执行
- 因此，`t27` 当前仅是**不可直接执行的候选方案**，不是当前主执行方案

### 当前不采用的路径
- 腾讯云前后端同服直出
- Nginx 作为前端当前公网主入口
- 以 COS + CDN 作为首选前端主托管方案

> 说明：后续如有条件变化，可重新评估腾讯云或 COS + CDN；但**当前已确认继续使用 Cloudflare Pages**。

---

## 范围 / 非目标

### 本方案涵盖
- 腾讯云服务器上的前端静态托管方案
- 腾讯云服务器上的后端服务续用与对齐方案
- Nginx 站点配置方案
- 自动部署方案（GitHub Actions → SSH → 服务器）
- 灰度切换、回滚、验收方案
- 文档替换顺序与历史配置清理原则

### 本方案不涵盖
- 业务功能新增
- 后端从 `systemd` 切回 PM2
- 当前阶段直接删除所有 Cloudflare 历史文件
- 当前阶段直接执行线上迁移
- 当前阶段引入新的腾讯云中间件（SLB、容器、TKE 等）

---

## 执行阶段拆分

### Phase 0 — 基线确认（先验收再改）

执行目标：确认当前能工作的部分，作为下阶段改动前的基线。

#### 需要确认
- 后端当前服务名、工作目录、监听端口
- 当前后端健康检查路径
- 前端当前构建命令与输出目录
- 当前前端 API 基址配置方式

#### 产出
- 一份现状基线记录
- 一份下阶段执行前必须通过的 smoke check 列表

#### 退出条件
- 后端运行基线确认完成
- 前端构建基线确认完成

---

### Phase 1 — 生产拓扑与域名策略定稿

执行目标：锁定主域名、API 路径、HTTPS 终止位置。

#### 核心决策
- 是否采用**同源 API**（推荐）
  - 前端访问 `/api/...`
  - Nginx 将 `/api/*` 反代到后端
- 是否保留 `api.weilanshanshan.top` 仅作为兼容入口
- HTTPS 终止在 Nginx，而不是应用层
- 执行本阶段前，必须先由人工确认**ICP备案已完成**

#### 推荐结果
- 主站：`https://weilanshanshan.top`
- API：主站同源 `/api/*`
- 可选兼容：`https://api.weilanshanshan.top` 反代同一个后端

#### 退出条件
- 人工已明确确认备案完成，可以进入腾讯云一体化切换
- 域名策略唯一确定
- HTTPS 终止位置唯一确定

---

### Phase 2 — 前端静态发布设计

执行目标：定义前端构建产物的服务器目录结构和切换方式。

#### 推荐目录结构

```text
/var/www/private-chef/
  ├── releases/
  │   ├── <git-sha-1>/
  │   └── <git-sha-2>/
  └── current -> releases/<git-sha>
```

#### 设计要求
- 通过 `dist/` 上传到版本目录
- 通过切换 `current` 软链接做原子发布
- `index.html` 设置为不强缓存
- `assets/*` 等 hash 文件设置长缓存
- Nginx 配置 SPA fallback，任意前端路由回退到 `index.html`

#### 退出条件
- 前端目录结构确定
- 前端切换与回滚动作明确

---

### Phase 3 — 后端服务部署对齐

执行目标：以当前 `systemd` 为中心，补齐自动部署与回滚动作。

#### 设计要求
- 延续现有 `private-chef-api.service`
- 后端部署仍以服务器目录内的构建产物为准
- 部署动作至少包括：
  1. 拉代码 / 上传产物
  2. 安装依赖
  3. 构建
  4. 执行数据库迁移（如需要）
  5. 重启或平滑重载服务
  6. 健康检查

#### 明确不做
- 不重新引入 PM2
- 不一边修线上一边改架构

#### 退出条件
- 后端部署顺序明确
- 后端失败回滚顺序明确

---

### Phase 4 — Nginx 接入层设计

执行目标：让 Nginx 成为唯一公网入口。

#### Nginx 需要覆盖
- `80 -> 443` 跳转
- 主域名静态文件托管
- SPA fallback
- `/api/*` 反向代理
- Web 安全响应头（按最小必需配置）
- gzip / brotli（按服务器可用能力决定）
- access/error log 路径

#### 推荐反代关系
- `/api/*` → `http://127.0.0.1:3000`
- `/` → `/var/www/private-chef/current`

#### 退出条件
- Nginx 配置模板足够完整，可直接落地

---

### Phase 5 — 自动部署设计

执行目标：让 push 代码后能自动部署到腾讯云。

#### 推荐方式
- 使用 **GitHub Actions**
- 前后端分开工作流，避免无关改动互相影响

#### 前端自动部署建议
- 触发条件：`private-chef/frontend/**` 变更或手动触发
- 流程：
  1. 安装依赖
  2. 执行 `npm run build`
  3. 上传 `dist/` 到服务器新的 release 目录
  4. 切换 `current` 软链接
  5. `nginx -t` + reload
  6. 执行 smoke test

#### 后端自动部署建议
- 触发条件：`private-chef/backend/**` 变更或手动触发
- 流程：
  1. SSH 到服务器
  2. 更新代码
  3. 安装依赖
  4. 构建
  5. 数据库迁移
  6. `systemctl restart private-chef-api`
  7. 健康检查

#### 退出条件
- CI/CD 流程可直接转成 `private-chef/.github/workflows/*.yml`

---

### Phase 6 — 切换与回滚策略

执行目标：确保真正上线时可安全切换，也可快速回退。

#### 切换顺序
1. 先完成前端静态目录与 Nginx 配置
2. 再对齐后端反代与健康检查
3. 先用临时域名 / 服务器本地验证
4. 最后切主域名流量

#### 回滚策略
- 前端：回退 `current` 软链接到上一个 release
- 后端：回退到上一个已知稳定 commit，并重启 `systemd`
- Nginx：保留上一个站点配置备份

#### 失败触发条件
- 首页无法打开
- 深链接路由返回 404
- `/api/health` 失败
- 登录态异常 / Cookie 丢失

#### 退出条件
- 回滚步骤已能口头转为执行脚本

---

### Phase 7 — 历史 Cloudflare 配置退役

执行目标：在腾讯云主路径验证成功后，再处理历史部署配置。

#### 原则
- 先验证腾讯云新路径成功
- 再标记旧 Cloudflare 文档“已废弃 / superseded”
- 最后才清理旧配置模板、旧说明、旧脚本

#### 当前阶段只做
- 在新方案中明确：当前前端主执行路径仍是 `T26`
- 在新方案中明确：`T27` 当前不可直接执行
- 如未来真的切换到腾讯云主路径，再单独把 `T25/T26` 标记为历史路径

#### 当前阶段不做
- 不宣称 Cloudflare 已完全移除
- 不提前删除历史文件

---

## 计划中的文件变更范围（下阶段执行时）

### 仓库内预计新增/修改
- `private-chef/.github/workflows/deploy-frontend.yml`
- `private-chef/.github/workflows/deploy-backend.yml`
- `private-chef/deploy/nginx/private-chef.conf`
- `private-chef/deploy/scripts/deploy-frontend.sh`
- `private-chef/deploy/scripts/deploy-backend.sh`
- `private-chef/deploy/scripts/smoke-test.sh`
- `private-chef/frontend/.env.production`（或等价生产配置）
- `private-chef/frontend/src/lib/api.ts`
- `private-chef/backend/scripts/deploy.sh`
- 腾讯云部署说明文档

### 服务器上预计新增/修改
- `/etc/nginx/sites-available/private-chef.conf`
- `/etc/nginx/sites-enabled/private-chef.conf`
- `/var/www/private-chef/releases/...`
- `/var/www/private-chef/current`
- 现有后端 `systemd` 服务配置（如需最小调整）

---

## 验证策略（先定义，再执行）

### 构建与配置验证
- 前端 `npm run build` 必须通过
- 后端相关测试 / 类型检查必须通过
- `nginx -t` 必须通过
- `systemd` 服务检查必须通过

### 生产 smoke test
- `GET /` 返回前端首页
- `GET /某个前端深链接` 不返回 404，而回到 SPA
- `GET /api/health` 或等价健康检查通过
- 登录后带 Cookie 的请求仍可正常工作

### 建议证据文件
- `.sisyphus/evidence/task-27-frontend-build.txt`
- `.sisyphus/evidence/task-27-backend-checks.txt`
- `.sisyphus/evidence/task-27-nginx-validate.txt`
- `.sisyphus/evidence/task-27-smoke-tests.txt`

---

## 验收标准

- [ ] 生产前端由腾讯云服务器托管
- [ ] 生产后端由腾讯云服务器托管
- [ ] Nginx 成为唯一公网入口
- [ ] 后端继续由 `systemd` 守护
- [ ] 前后端生产访问路径足够简单，优先同源
- [ ] 自动部署方案已具体到可直接实现
- [ ] 前端发布支持原子切换
- [ ] 前端与后端都具备回滚路径
- [ ] 主域名、HTTPS、备案、DNS 要求已写清
- [ ] 不再把 `T25/T26` 表述为当前已废弃或历史路径

---

## 禁止事项

- ❌ 不把 Cloudflare Pages / T26 写成“当前不可用”或“已经废弃”
- ❌ 不重新把后端切回 PM2
- ❌ 不在未验证新路径前删除历史 Cloudflare 文件
- ❌ 不把“计划中动作”写成“已经完成”
- ❌ 不把自动部署留成只有口头说明、没有具体落点

---

## QA 场景

```text
Scenario: Frontend build baseline valid
  Tool: Bash
  Steps:
    1. cd private-chef/frontend && npm run build
    2. Assert dist/ exists
  Expected Result: frontend artifact ready for Tencent static deployment

Scenario: Nginx config valid
  Tool: Bash
  Steps:
    1. sudo nginx -t
    2. Assert syntax is ok
  Expected Result: nginx config can be safely reloaded

Scenario: SPA fallback works
  Tool: Browser / curl
  Steps:
    1. Request /
    2. Request a deep-link route
  Expected Result: both resolve to the SPA entry

Scenario: API proxy works
  Tool: curl
  Steps:
    1. Request /api/health through nginx
    2. Assert backend responds successfully
  Expected Result: edge proxy routes traffic to backend correctly

Scenario: Session cookie still works
  Tool: Browser / HTTP client
  Steps:
    1. Log in through production HTTPS domain
    2. Call an authenticated API
  Expected Result: secure cookie/session flow remains valid

Scenario: Frontend rollback works
  Tool: Bash
  Steps:
    1. Repoint current symlink to previous release
    2. Reload nginx if necessary
  Expected Result: previous frontend version restored quickly
```

---

## 提交建议（下阶段执行时）

1. `test(deploy): add tencent deploy verification checks`
2. `feat(frontend-deploy): add nginx-based static release flow`
3. `feat(backend-deploy): align systemd deploy workflow`
4. `ci(deploy): add github actions for tencent deployment`
5. `docs(deploy): add tencent-only production runbook`
6. `chore(deploy): retire obsolete cloudflare-first docs after cutover`

---

## 技术方案参考

- `.sisyphus/plans/tasks/t25-backend-deploy.md`
- `.sisyphus/plans/tasks/t26-frontend-deploy.md`
- `.sisyphus/plans/tasks/README.md`
- `私厨-技术方案.md`
- `private-chef/私厨-技术方案.md`

---

## 下一阶段执行原则

下阶段开始执行时，按以下顺序推进：

1. 先验证现状，不直接改线上
2. 先落 Nginx 与前端静态目录方案
3. 再对齐后端自动部署
4. 再接 GitHub Actions
5. 最后再切生产入口
6. 腾讯云路径验证通过后，再处理 Cloudflare 历史配置
