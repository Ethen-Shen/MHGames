# 🔄 墨焕游戏完整流程文档

> ⏰ 最后更新: 2026-05-22 | 🏷️ 版本: v3.0

---

## 一、系统架构总览

```
┌─────────────────────────────────────────────────────────┐
│                     用户 (Telegram 客户端)                │
│                          │                               │
│              ┌───────────┴───────────┐                   │
│              ▼                       ▼                   │
│         Bot1 (2048)            Bot2 (Particle)           │
│         Token: 8979...         Token: 8896...            │
│              │                       │                   │
│              ▼                       ▼                   │
│     ┌─────────────────────────────────────┐              │
│     │         Vercel Serverless           │              │
│     │  /api/webhook    /api/webhook-gs    │              │
│     └──────────────┬──────────────────────┘              │
│                    │                                     │
│                    ▼                                     │
│     ┌──────────────────────────────────────┐             │
│     │         mohuan.asia (静态站点)         │             │
│     │  /games/2048/    /games/particle/    │             │
│     │  + AdsGram SDK   + AdsGram SDK       │             │
│     └──────────────────────────────────────┘             │
└─────────────────────────────────────────────────────────┘
```

---

## 二、用户进入游戏流程

### ✅ v3.0 正确流程（web_app 按钮）

```
用户打开 Bot 对话
       │
       ▼
  发送 /start 或 /play
       │
       ▼
  Bot 收到消息，调用 sendMessage API
  返回带 InlineKeyboardButton 的消息
  按钮类型: web_app
  按钮文字: 🎮 Play Neon 2048
  web_app.url: https://mohuan.asia/games/2048/index.html
       │
       ▼
  用户看到消息中的按钮，点击按钮
       │
       ▼
  Telegram 客户端内嵌 WebView 打开 URL
  URL 自动附带 hash 参数:
    tgWebAppData=initData=...&user=...&query_id=...
       │
       ▼
  游戏页面 <head> 中:
    1. telegram-web-app.js 解析参数
    2. Telegram.WebApp 对象可用
    3. Telegram.WebApp.ready() 通知客户端就绪
    4. Telegram.WebApp.expand() 展开全屏
    5. sad.min.js (AdsGram SDK) 加载
    6. window.Adsgram.init() 初始化广告
       │
       ▼
  ✅ 游戏正常运行，广告可以显示
```

### ❌ v1.0 旧流程（sendGame，已弃用）

```
用户打开 Bot 对话
       │
       ▼
  发送 /play
       │
       ▼
  Bot 调用 sendGame API
  返回游戏卡片 (Game 类型消息)
       │
       ▼
  用户点击游戏卡片
       │
       ▼
  Telegram 在外部浏览器中打开游戏 URL
  URL 没有 tgWebAppData 参数
       │
       ▼
  ❌ Telegram.WebApp.initData 为空
  ❌ AdsGram 报错: Unable to retrieve launch parameters
  ❌ 广告无法显示
```

---

## 三、广告显示流程

### 激励广告（Rewarded Ad）

```
用户在游戏中触发广告场景:
  - 2048: 点击"Watch Ad + BLOCK" / "Watch Ad - BLOCK" / "Watch Ad to Revive"
  - 粒子: 点击"Time +30s" / "Life +1" 复活按钮
       │
       ▼
  game.js 调用 showAd(callback)
       │
       ▼
  检查 window.adReward 是否存在
       │
       ├── 不存在 → handleCancel() → 不给奖励，游戏继续
       │
       └── 存在 → 调用 adReward.show()
              │
              ▼
         AdsGram SDK 向服务器请求广告
              │
              ├── 请求失败 → .catch() → handleCancel() → 不给奖励
              │
              └── 广告加载成功 → 显示全屏广告
                     │
                     ├── 用户跳过广告 → .then(result)
                     │   result.done = false → handleCancel() → 不给奖励
                     │
                     └── 用户看完广告 → .then(result)
                         result.done = true → handleReward() → 执行 callback
                         (2048: 加/删方块/复活)
                         (粒子: 加时间/加生命)
```

### 插屏广告（Interstitial Ad）

```
游戏中自然暂停点:
  - 2048: 游戏结束
  - 粒子: 游戏结束
       │
       ▼
  game.js 调用 showInterstitialAd()
       │
       ▼
  检查 window.adInterstitial 是否存在
       │
       ├── 不存在 → 跳过
       │
       └── 存在 → 调用 adInterstitial.show()
              │
              ▼
         显示全屏广告
              │
              ├── 用户关闭 → .then() → 继续
              └── 用户看完 → .then() → 继续
```

---

## 四、页面加载时序

```
用户点击 web_app 按钮
       │
       ▼  (Telegram 自动附加参数)
  浏览器开始加载 index.html
       │
       ▼  (按 <head> 顺序执行)
  1. <script src="telegram-web-app.js">  ← 解析 Telegram 参数
  2. <script src="sad.min.js">           ← 加载 AdsGram SDK
  3. <script> 内联代码:
     - Telegram.WebApp.ready()           ← 通知客户端就绪
     - Telegram.WebApp.expand()          ← 展开全屏
     - Adsgram.init({ blockId }) × 2     ← 初始化激励+插屏广告
       │
       ▼  (继续加载 <body>)
  4. <link rel="stylesheet">             ← 加载样式
  5. HTML 结构渲染                        ← 游戏界面
  6. <script src="lang.js">              ← 多语言
  7. <script src="game.js">              ← 游戏逻辑
       │
       ▼
  游戏初始化完成，等待用户操作
```

---

## 五、三 Bot 架构

```
┌──────────────────────────────────────────────────┐
│                  bot-server.js                    │
│              (本地 polling 模式)                    │
│                                                   │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  │     Bot1         │ │     Bot2         │ │     Bot3         │
│  │  Token: 8979...  │ │  Token: 8896...  │ │  Token: 8888...  │
│  │                  │ │                  │ │                  │
│  │  /start → 🎮按钮  │ │  /start → 💥按钮  │ │  /start → 🐂按钮  │
│  │  /play  → 🎮按钮  │ │  /play  → 💥按钮  │ │  /play  → 🐂按钮  │
│  │  /help  → 帮助    │ │  /help  → 帮助    │ │  /help  → 帮助    │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│               Vercel Serverless                   │
│              (生产 webhook 模式)                    │
│                                                   │
│  /api/webhook.js          /api/webhook-greedysnakes.js
│  Bot1 Token               Bot2 Token              │
│  发送 2048 web_app 按钮    发送 Particle web_app 按钮 │
│                                                   │
│  /api/webhook-findcow.js                         │
│  Bot3 Token                                        │
│  发送 Find the Bull web_app 按钮                   │
└──────────────────────────────────────────────────┘
```

---

## 六、关键代码对应关系

| 流程步骤 | 代码位置 | 关键代码 |
|---------|---------|---------|
| Bot 发送 web_app 按钮 | `bot-server.js` / `api/webhook*.js` | `web_app: { url: GAME_URL }` |
| Telegram 参数解析 | `games/*/index.html` `<head>` | `telegram-web-app.js` |
| 通知客户端就绪 | `games/*/index.html` `<head>` | `Telegram.WebApp.ready()` |
| 展开全屏 | `games/*/index.html` `<head>` | `Telegram.WebApp.expand()` |
| AdsGram SDK 加载 | `games/*/index.html` `<head>` | `sad.min.js` |
| 广告初始化 | `games/*/index.html` `<head>` | `window.Adsgram.init({ blockId })` |
| 激励广告显示 | `games/*/game.js` | `showAd(callback)` → `adReward.show()` |
| 插屏广告显示 | `games/*/game.js` | `showInterstitialAd()` → `adInterstitial.show()` |
| 广告结果处理 | `games/*/game.js` | `.then(result)` → `result.done` 判断 |

---

## 七、错误排查流程

### 广告不显示

```
广告不显示
    │
    ├── 检查入口方式
    │   ├── 通过 sendGame 卡片进入 → ❌ 改用 web_app 按钮
    │   └── 通过 web_app 按钮进入 → ✅ 继续排查
    │
    ├── 检查控制台错误
    │   ├── "Unable to retrieve launch parameters" → 不在 Telegram 环境中
    │   ├── "AdsGram SDK not loaded" → sad.min.js 加载失败
    │   └── "adReward not available" → init 未执行或失败
    │
    ├── 检查 SDK 加载
    │   ├── sad.min.js 是否在 <head> 中 → 必须在 <head>
    │   └── API 名称是否正确 → 必须是 window.Adsgram（小写 g）
    │
    └── 检查 BlockId
        ├── 激励广告 BlockId 是否正确
        └── 插屏广告 BlockId 是否正确
```

### 游戏卡顿

```
游戏卡顿
    │
    ├── 检查背景动画 → v3.0 已移除，不应有
    ├── 检查粒子效果 → v3.0 已简化，不应有爆炸粒子
    └── 检查 requestAnimationFrame → 不应有未取消的动画循环
```

---

## 八、部署流程

```
本地修改代码
       │
       ▼
git add . && git commit && git push
       │
       ▼
GitHub 仓库更新
       │
       ▼
Vercel 自动部署 (约 1-2 分钟)
       │
       ▼
部署成功 → mohuan.asia 更新
       │
       ▼
运行 npm run webhook:set (仅首次或更换 URL 时)
       │
       ▼
在 Telegram 中测试
```

---

## 相关文档

- [README.md](./README.md) — 项目总览
- [DIRECTORY_STRUCTURE.md](./DIRECTORY_STRUCTURE.md) — 目录结构
- [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md) — 部署指南
- [BOT_SETUP.md](./BOT_SETUP.md) — Bot 设置
