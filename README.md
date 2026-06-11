# 墨焕游戏 Telegram Mini App

> 🎮 Telegram 小游戏平台 — Neon 2048 & Particle Blast & Find the Bull
> 
> ⏰ 最后更新: 2026-06-11 | 🏷️ 版本: v4.0

## 项目简介

基于 Telegram Web App 的三游戏平台，通过三个独立 Bot 分别管理三个游戏，集成 AdsGram 广告变现。

| 游戏 | Bot | 入口按钮 |
|------|-----|---------|
| Neon 2048 | Bot1 (`@xxxBot`) | 🎮 Play Neon 2048 |
| Particle Blast | Bot2 (`@xxxBot`) | 💥 Play Particle Blast |
| Find the Bull | Bot3 (`@xxxBot`) | 🐂 Play Find the Bull |

### 核心特性

- 🎮 两款独立游戏，各由一个 Bot 管理
- 📱 Telegram Mini App 模式（`web_app` 按钮），内嵌 WebView 运行
- 💰 AdsGram 广告变现（激励视频 + 插屏广告）
- 🌍 中英文多语言
- 🚀 Vercel 云部署 + Webhook
- 📊 本地最高分记录

---

## 快速开始

```bash
# 安装依赖
npm install

# 本地运行双 Bot（polling 模式）
npm start

# 设置 Webhook（Vercel 部署后）
npm run webhook:set

# 查看 Webhook 状态
npm run webhook:info
```

---

## 三 Bot 配置

| | Bot1 (Neon 2048) | Bot2 (Particle Blast) | Bot3 (Find the Bull) |
|---|---|---|---|
| Token | `8979472034:AAF4E2q...` | `8896711967:AAG8tStYI...` | `8888888888:PLACEHOLDER_FINDCOW` |
| Webhook 路径 | `/api/webhook` | `/api/webhook-greedysnakes` | `/api/webhook-findcow` |
| 游戏页面 | `/games/2048/index.html` | `/games/particle/index.html` | `/games/findcow/index.html` |
| 激励广告 BlockId | `31225` | `30885` | `31500` |
| 插屏广告 BlockId | `int-30882` | `int-30886` | `int-31501` |
| 命令 | `/start` `/play` `/help` | `/start` `/play` `/help` | `/start` `/play` `/help` |

---

## 广告变现

使用 [AdsGram](https://adsgram.ai) 广告平台，严格按官方 API 规范集成：

- **SDK 位置**: `<head>` 中加载 `sad.min.js`
- **API 名称**: `window.Adsgram.init()`（小写 g）
- **激励广告**: `AdController.show().then()` — `result.done === true` 时给奖励
- **插屏广告**: `AdController.show().then()` — 用户关闭或看完都触发
- **初始化时机**: `Telegram.WebApp.ready()` 之后立即 `Adsgram.init()`

> ⚠️ 广告仅在 Telegram 客户端内通过 `web_app` 按钮打开时有效。浏览器直接访问会报 `Unable to retrieve launch parameters`，这是正常行为。

---

## 技术栈

| 层 | 技术 |
|----|------|
| 前端 | HTML5 + CSS3 + Vanilla JS |
| Bot | node-telegram-bot-api (polling) |
| Webhook | Vercel Serverless Functions |
| 广告 | AdsGram SDK |
| 部署 | Vercel + GitHub |
| 域名 | `https://mohuan.asia` |

---

## 项目结构

```
TelegramGames/
├── index.html                    # 首页（游戏选择）
├── bot-server.js                 # 三 Bot 本地服务（polling 模式）
├── package.json
├── vercel.json
├── games/
│   ├── 2048/
│   │   ├── index.html            # 2048 游戏页面（含 AdsGram SDK）
│   │   ├── game.js               # 游戏逻辑 + 广告显示
│   │   ├── styles.css
│   │   ├── lang.js
│   │   ├── game.json
│   │   └── minigame.config.json
│   ├── particle/
│   │   ├── index.html            # 粒子消除游戏页面（含 AdsGram SDK）
│   │   ├── game.js               # 游戏逻辑 + 广告显示
│   │   ├── styles.css
│   │   ├── lang.js
│   │   ├── game.json
│   │   ├── game_backup.js
│   │   └── minigame.config.json
│   └── findcow/                  # 找牛牛（Find the Bull）
│       ├── index.html            # 找牛游戏页面（含 AdsGram SDK）
│       ├── game.js               # 游戏核心 + 道具 + 签到 + 商店
│       ├── styles.css
│       ├── lang.js
│       ├── levels.js             # 30 关卡数据
│       ├── game.json
│       └── minigame.config.json
├── api/
│   ├── webhook.js                # Bot1 Webhook (Neon 2048)
│   ├── webhook-greedysnakes.js   # Bot2 Webhook (Particle Blast)
│   └── webhook-findcow.js        # Bot3 Webhook (Find the Bull)
├── scripts/
│   └── set-webhook.js            # 三 Bot Webhook 设置脚本
├── README.md
├── FLOW.md                       # 流程文档
├── DIRECTORY_STRUCTURE.md
├── VERCEL_DEPLOY.md
├── BOT_SETUP.md
└── UPLOAD_GUIDE.md
```

---

## 文档索引

| 文档 | 说明 |
|------|------|
| [FLOW.md](./FLOW.md) | 🆕 完整流程文档（用户→Bot→游戏→广告） |
| [DIRECTORY_STRUCTURE.md](./DIRECTORY_STRUCTURE.md) | 目录结构详解 |
| [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md) | Vercel 部署指南 |
| [BOT_SETUP.md](./BOT_SETUP.md) | Bot 设置指南 |
| [UPLOAD_GUIDE.md](./UPLOAD_GUIDE.md) | GitHub 上传指南 |

---

## 更新日志

### v4.0 (2026-06-11)
- 🆕 **新增游戏**: 找牛牛 (Find the Bull) - 30+ 关卡找物品游戏
- 🆕 **新增 Bot3**: 独立 Webhook `/api/webhook-findcow`
- 🆕 **道具系统**: 🔍 放大镜 / ⏰ +15s / 💣 排除 / ❄️ 冰冻
- 🆕 **每日签到**: 7 天循环奖励
- 🆕 **商店系统**: 3 个 Stars 道具包
- 🆕 **首页追加** 找牛牛游戏卡片
- ✅ 现有 2048 / Particle 完全无改动

### v3.0 (2026-05-22)
- 🔴 **关键修复**: Bot 从 `sendGame` 改为 `web_app` 按钮模式，修复广告不显示
- 🔴 **关键修复**: AdsGram API 名称 `AdsGram` → `Adsgram`（小写 g）
- 🔴 **关键修复**: SDK 从 `<body>` 移到 `<head>`，符合官方规范
- ✅ 双 Bot 架构：Bot1 管 2048，Bot2 管粒子消除
- ✅ 移除背景动画，大幅提升游戏性能
- ✅ 简化粒子爆炸效果
- ✅ `Telegram.WebApp.ready()` + `expand()` 只在 `<head>` 调用一次
- ✅ 广告逻辑严格按 AdsGram 官方 API 规范

### v2.0
- 移除背景动画和粒子效果
- 优化广告初始化逻辑

### v1.0
- 初始版本

---

© 2026 墨焕游戏. All rights reserved.
