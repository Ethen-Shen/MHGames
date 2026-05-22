# 🚀 Vercel 部署指南

> ⏰ 最后更新: 2026-05-22 | 🏷️ 版本: v3.0

---

## 前提条件

- ✅ 代码已推送到 GitHub (`https://github.com/Ethen-Shen/MHGames`)
- ✅ Vercel 已连接 GitHub 仓库
- ✅ 域名 `mohuan.asia` 已配置

---

## 部署步骤

### 1. 推送代码

```bash
cd d:/TelegramGames/TelegramGames
git add .
git commit -m "v3.0: 双Bot改用web_app按钮，修复广告"
git push
```

Vercel 会自动重新部署。

### 2. 设置 Webhook

部署成功后运行：

```bash
npm run webhook:set
```

输出示例：
```
🔗 设置 Bot1 (Neon 2048) Webhook...
📡 Webhook URL: https://www.mohuan.asia/api/webhook
✅ Bot1 (Neon 2048) Webhook 设置成功！

🔗 设置 Bot2 (Particle Blast) Webhook...
📡 Webhook URL: https://www.mohuan.asia/api/webhook-greedysnakes
✅ Bot2 (Particle Blast) Webhook 设置成功！
```

### 3. 查看 Webhook 状态

```bash
npm run webhook:info
```

---

## Webhook 路由

| Bot | Vercel 函数 | Webhook URL |
|-----|-----------|-------------|
| Bot1 (2048) | `api/webhook.js` | `https://www.mohuan.asia/api/webhook` |
| Bot2 (粒子) | `api/webhook-greedysnakes.js` | `https://www.mohuan.asia/api/webhook-greedysnakes` |

---

## 部署验证清单

推送代码后，逐项检查：

### Bot 功能
- [ ] 给 Bot1 发 `/start` → 收到带 🎮 按钮的消息
- [ ] 给 Bot2 发 `/start` → 收到带 💥 按钮的消息
- [ ] 点击按钮 → 在 Telegram 内打开游戏（不是外部浏览器）

### 广告功能
- [ ] 2048 游戏中点击"Watch Ad" → 广告正常弹出
- [ ] 粒子消除游戏中点击复活 → 广告正常弹出
- [ ] 广告看完 → 正确获得奖励
- [ ] 广告跳过 → 不给奖励但不卡住

### 性能
- [ ] 游戏流畅，无背景动画
- [ ] 粒子消除无爆炸粒子效果
- [ ] 控制台无 `AdsgramError`

---

## 常见问题

### Q: 浏览器直接打开游戏 URL 报 `Unable to retrieve launch parameters`
A: 正常行为。AdsGram 只在 Telegram 客户端内通过 `web_app` 按钮打开时才有效。

### Q: 点击按钮后游戏在外部浏览器打开
A: 说明用的不是 `web_app` 按钮模式。检查 Bot 代码是否使用 `InlineKeyboardButton` 的 `web_app` 字段。

### Q: Webhook 设置失败
A: 确认 Vercel 已部署成功，API 路由可访问：`https://www.mohuan.asia/api/webhook`

---

## 相关文档

- [FLOW.md](./FLOW.md) — 完整流程文档
- [BOT_SETUP.md](./BOT_SETUP.md) — Bot 设置指南
- [DIRECTORY_STRUCTURE.md](./DIRECTORY_STRUCTURE.md) — 目录结构
