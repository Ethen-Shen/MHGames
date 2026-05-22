# 📂 项目目录结构说明

> ⏰ 最后更新: 2026-05-22 | 🏷️ 版本: v3.0

---

## 根目录文件

| 文件 | 说明 |
|------|------|
| `index.html` | 首页 — 游戏选择页面 |
| `setup.html` | 初始设置页面 |
| `bot-server.js` | 双 Bot 本地服务（Bot1 + Bot2，polling 模式） |
| `package.json` | 项目依赖和脚本 |
| `vercel.json` | Vercel 部署配置 |
| `README.md` | 项目说明 |
| `FLOW.md` | 流程文档 |
| `DIRECTORY_STRUCTURE.md` | 本文件 |
| `VERCEL_DEPLOY.md` | 部署指南 |
| `BOT_SETUP.md` | Bot 设置指南 |
| `UPLOAD_GUIDE.md` | GitHub 上传指南 |

---

## `/games/2048/` — Neon 2048 游戏

| 文件 | 说明 |
|------|------|
| `index.html` | 游戏页面。`<head>` 中加载 `telegram-web-app.js` + `sad.min.js`，初始化 `Telegram.WebApp.ready()` + `Adsgram.init()` |
| `game.js` | 游戏核心逻辑 + `showAd()` / `showInterstitialAd()` 广告函数 |
| `styles.css` | 霓虹风格样式 |
| `lang.js` | 中英文翻译 |
| `game.json` | 游戏元数据 |
| `minigame.config.json` | Telegram Mini App 配置 |

### 广告 BlockId

| 类型 | BlockId |
|------|---------|
| 激励广告 | `31225` |
| 插屏广告 | `int-30882` |

---

## `/games/particle/` — Particle Blast 游戏

| 文件 | 说明 |
|------|------|
| `index.html` | 游戏页面。`<head>` 中加载 `telegram-web-app.js` + `sad.min.js`，初始化同 2048 |
| `game.js` | 游戏核心逻辑 + `showAd()` / `showInterstitialAd()` 广告函数 |
| `styles.css` | 粒子游戏样式 |
| `lang.js` | 中英文翻译 |
| `game.json` | 游戏元数据 |
| `game_backup.js` | 游戏逻辑备份 |
| `minigame.config.json` | Telegram Mini App 配置 |

### 广告 BlockId

| 类型 | BlockId |
|------|---------|
| 激励广告 | `30885` |
| 插屏广告 | `int-30886` |

---

## `/api/` — Vercel Serverless Functions

| 文件 | 说明 | 对应 Bot |
|------|------|---------|
| `webhook.js` | Bot1 Webhook 处理 | Neon 2048 (`8979472034`) |
| `webhook-greedysnakes.js` | Bot2 Webhook 处理 | Particle Blast (`8896711967`) |

两个 Webhook 都使用 `sendMessage` + `InlineKeyboardButton web_app` 模式发送游戏入口。

---

## `/scripts/` — 工具脚本

| 文件 | 说明 |
|------|------|
| `set-webhook.js` | 一键设置双 Bot Webhook，同时设置 Bot1 和 Bot2 |

---

## 关键代码位置速查

| 需求 | 文件 | 位置 |
|------|------|------|
| 修改广告 BlockId | `games/*/index.html` | `<head>` 中 `Adsgram.init({ blockId: "..." })` |
| 修改广告显示逻辑 | `games/*/game.js` | `showAd()` 和 `showInterstitialAd()` 函数 |
| 修改 Bot 回复内容 | `bot-server.js` 或 `api/webhook*.js` | 各命令处理函数 |
| 修改游戏 URL | `bot-server.js` 和 `api/webhook*.js` | 顶部 `GAME_URL_*` 常量 |
| 修改多语言 | `games/*/lang.js` | 翻译对象 |
| 修改样式 | `games/*/styles.css` | CSS 文件 |

---

## v3.0 变更记录

- Bot 从 `sendGame` 改为 `web_app` 按钮
- AdsGram SDK 移到 `<head>`
- API 名称 `AdsGram` → `Adsgram`
- 移除背景动画和粒子爆炸效果
- 双 Bot 独立 Webhook
