# Task 05 — 企微 Webhook 推送模块

> **Wave**: 1 | **可并行**: 与 T01-T04 同时开始 | **预估**: 15 分钟
>
> **依赖**: T01（需要 backend 依赖已安装）
>
> **后续任务等我完成**: T21（后端入口集成）

---

## 🔴 人工信息检查点

> **执行到通知功能测试时需要暂停！**
>
> ```
> ⏸️ 需要人工提供以下信息才能发送测试通知：
>
> WECHAT_WEBHOOK_URL = ?
>
> 获取方式：企业微信 → 内部群 → 群设置 → 群机器人 → 复制 Webhook URL
> 格式：https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx
>
> 如果还没创建群机器人，请先完成技术方案 13.1 节 #6-#8 步骤。
>
> 拿到后粘贴给我，我会写入 backend/.env 并发送一条测试消息验证。
> ```
>
> **如果暂时没有 Webhook URL**：代码可以先写完，类型检查通过即可。

---

## 目标

创建 `backend/src/lib/wechat.ts`，实现企业微信群机器人通知推送，含消息队列和限流处理。

## 具体步骤

### 创建 `backend/src/lib/wechat.ts`

完整实现参照技术方案第十节（第 588-629 行），关键要点：

**核心逻辑**：
- 从 `env.WECHAT_WEBHOOK_URL` 读取 Webhook URL
- 消息队列 + 滑动窗口限流（间隔 3 秒发送）
- 检查响应 body 的 `errcode`（企微总返回 HTTP 200，**不看 HTTP status**）
- `errcode === 45009` 时等 60 秒重试
- notify 函数 fire-and-forget，不阻塞业务请求

**导出函数**：

```typescript
// 通用发送
export function notify(content: string): void

// 场景化通知（带 emoji 和格式）
export function notifyNewOrder(userName: string, mealType: string, items: string[]): void
// 消息: 「🍽️ {userName}点了{mealType}：{items.join('、')}」

export function notifyNewRecipe(userName: string, recipeName: string, cookMinutes?: number): void  
// 消息: 「👨‍🍳 {userName}新增菜谱：{recipeName}（预计{cookMinutes}分钟）」

export function notifyNewWish(userName: string, dishName: string): void
// 消息: 「🌟 {userName}许愿想吃：{dishName}」
```

**限流实现**：
- 维护一个 `queue: string[]` 数组
- `sending` 锁防止并发消费
- 每条消息发送后 `await sleep(3000)`（3 秒间隔）
- 收到 `errcode: 45009` 时，将消息放回队首，等 60 秒后继续

## 验收标准

- [ ] 导出 `notify` + 3 个场景化函数
- [ ] 消息间隔 3 秒（`3000ms`）
- [ ] `errcode === 45009` 时等 60 秒重试
- [ ] 检查 `body.errcode` 而不是 HTTP status
- [ ] `notify` 是 fire-and-forget（不返回 Promise 给调用者）
- [ ] `npx tsc --noEmit` 通过

## 禁止事项

- 不硬编码 Webhook URL
- 不看 HTTP status 判断成功（企微总返回 200）
