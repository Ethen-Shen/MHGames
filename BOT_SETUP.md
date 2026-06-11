# 🤖 三 Bot 设置指南

> ⏰ 最后更新: 2026-06-11 | 🏷️ 版本: v4.0

---

## Bot 信息

| | Bot1 (Neon 2048) | Bot2 (Particle Blast) | Bot3 (Find the Bull) |
|---|---|---|---|
| Token | `8979472034:AAF4E2qOXRiTsZWjlX5Kepxb47Eyy_QvHwk` | `8896711967:AAG8tStYIwVSCPMyCzx-wH22pYqQcXoet-E` | `8888888888:PLACEHOLDER_BOT3_TOKEN_FINDCOW` |
| 游戏 URL | `https://mohuan.asia/games/2048/index.html` | `https://mohuan.asia/games/particle/index.html` | `https://mohuan.asia/games/findcow/index.html` |
| Webhook | `/api/webhook` | `/api/webhook-greedysnakes` | `/api/webhook-findcow` |
| 激励广告 | `31225` | `30885` | `31500` |
| 插屏广告 | `int-30882` | `int-30886` | `int-31501` |

---

## 在 BotFather 中配置

### 1. 设置 Bot 描述

对三个 Bot 分别在 @BotFather 中执行：

**Bot1:**
```
/setdescription → 选择 Bot1 → Neon 2048 - 经典数字拼图游戏，霓虹风格！
/setabouttext → 选择 Bot1 → 🎮 Neon 2048 Mini App
```

**Bot2:**
```
/setdescription → 选择 Bot2 → Particle Blast - 点击消除相同颜色的粒子！
/setabouttext → 选择 Bot2 → 💥 Particle Blast Mini App
```

**Bot3:**
```
/setdescription → 选择 Bot3 → Find the Bull - 找牛牛找物品游戏！
/setabouttext → 选择 Bot3 → 🐂 Find the Bull Mini App
```

### 2. 设置 Bot 命令

对三个 Bot 分别执行 `/setcommands`：

```
start - 开始游戏
play - 开始游戏
help - 帮助信息
```

### 3. 设置菜单按钮（可选）

在 @BotFather 中：
```
/setmenubutton → 选择 Bot → 输入按钮文字 → 输入游戏 URL
```

- Bot1: 按钮文字 `🎮 Play 2048`，URL `https://mohuan.asia/games/2048/index.html`
- Bot2: 按钮文字 `💥 Play Particle`，URL `https://mohuan.asia/games/particle/index.html`
- Bot3: 按钮文字 `🐂 Play Find the Bull`，URL `https://mohuan.asia/games/findcow/index.html`

### 4. 设置 Mini App（推荐）

在 @BotFather 中：
```
/mybots → 选择 Bot → Bot Settings → Configure Mini App → Enable Mini App
```

上传封面图和设置游戏 URL。设置后用户可以在 Bot 资料页直接看到"Open App"按钮。

---

## 运行模式

### 模式 A：本地 Polling（开发用）

```bash
npm start
```

`bot-server.js` 同时运行三个 Bot，使用 long polling 接收消息。

### 模式 B：Vercel Webhook（生产用）

```bash
# 设置 Webhook
npm run webhook:set

# 查看状态
npm run webhook:info
```

三个 Webhook 端点：
- `https://www.mohuan.asia/api/webhook` → Bot1
- `https://www.mohuan.asia/api/webhook-greedysnakes` → Bot2
- `https://www.mohuan.asia/api/webhook-findcow` → Bot3

> ⚠️ Polling 和 Webhook 不能同时使用。生产环境用 Webhook 时不要运行 `npm start`。

---

## Bot 发送消息的方式

### ✅ 当前方式：`web_app` 按钮（v3.0+）

```javascript
bot.sendMessage(chatId, '点击开始游戏：', {
  reply_markup: {
    inline_keyboard: [
      [{ text: '🎮 Play Neon 2048', web_app: { url: GAME_URL } }]
    ]
  }
});
```

用户点击按钮 → Telegram 内嵌 WebView 打开 → 自动传递 `initData` → AdsGram 正常工作 ✅

### ❌ 旧方式：`sendGame`（已弃用）

```javascript
bot.sendGame(chatId, 'neon2048');
```

用户点击卡片 → 外部浏览器打开 → 没有 `initData` → AdsGram 报错 ❌

---

## 测试清单

- [ ] Bot1 `/start` → 收到 🎮 按钮
- [ ] Bot2 `/start` → 收到 💥 按钮
- [ ] Bot3 `/start` → 收到 🐂 按钮
- [ ] 点击按钮 → Telegram 内打开游戏
- [ ] 游戏中广告正常显示
- [ ] 三个 Bot `/help` → 显示帮助

---

## 相关文档

- [README.md](./README.md) — 项目总览
- [FLOW.md](./FLOW.md) — 完整流程文档
- [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md) — 部署指南
- [DIRECTORY_STRUCTURE.md](./DIRECTORY_STRUCTURE.md) — 目录结构
