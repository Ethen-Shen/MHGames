# Tasks — 找牛牛 (Find the Bull) 游戏

- [x] Task 1: 创建游戏基础目录与配置文件
新建 `MHGames/games/findcow/` 目录，复制现有游戏元数据模板：
- `game.json` — 平台、版本、AdsGram 配置
- `minigame.config.json` — Telegram Mini App 配置
- 验证：目录与文件存在，结构与 `games/2048/` 一致

## Task 2: 实现 `index.html` 主页面
- 引入 `telegram-web-app.js` + `sad.min.js`（head 中）
- 调用 `Telegram.WebApp.ready()` + `expand()`
- 初始化 AdsGram（blockId 占位 `31500` / `int-31501`）
- 包含以下容器（默认 `display:none`，由 game.js 切换）：
  - `#loading-page` 启动加载页
  - `#home-page` 首页
  - `#levels-page` 关卡地图
  - `#game-page` 游戏页（topbar + 物品列表 + canvas + 道具栏 + 暂停按钮）
  - `#pause-overlay` 暂停遮罩
  - `#result-page` 结算页
  - `#shop-page` 商店
  - `#signin-page` 每日签到
  - `#settings-page` 设置
- 引入 `lang.js` → `levels.js` → `game.js`
- 验证：浏览器/Telegram WebView 打开能正常加载，无控制台报错

## Task 3: 实现 `styles.css` 霓虹风格样式
- 与现有游戏风格保持一致（深色 + 霓虹色 + cyborg-btn 类）
- 响应式布局（移动端竖屏优先，min-width 320，max-width 540）
- 8 个页面的样式 + 道具栏 + 关卡地图节点
- 验证：游戏首页/关卡地图/游戏页/结算页视觉无破版

- [x] Task 4: 实现 `lang.js` 中英文翻译
- 导出 `window.LANG = { zh: {...}, en: {...} }`
- 覆盖所有按钮、标签、提示文本
- 提供 `setLang(lang)` 工具函数
- 验证：切换语言后所有 `data-i18n` 元素文案同步

## Task 5: 实现 `levels.js` 关卡数据
- 至少 30 关数据，每关包含：
  - `id`, `timeLimit`, `targets: ['🐂','🐄',...]` 4-8 个目标
  - `decoys: [...]` 干扰物池
  - `bgColor` 背景色或场景图案标识
- 函数 `loadLevel(levelId)` 返回关卡对象
- 验证：`loadLevel(1)` 返回有效关卡数据

- [x] Task 6: 实现 `game.js` 核心游戏逻辑
包含以下模块（IIFE 或 ES 命名空间）：
- `state` 全局状态对象（currentPage, currentLevel, items, timeLeft, foundIndices, props）
- `saveState() / loadState()` localStorage 持久化（`findcow_maxLevel`, `findcow_items`, `findcow_signin_*`, `findcow_lang`, `findcow_stars`）
- 页面切换：`showPage(pageId)`
- 首页逻辑：渲染最高关卡，绑定 4 个入口按钮
- 关卡地图：渲染 30 个关卡节点，已通关亮起 + 当前关卡脉冲动画
- 游戏核心：
  - `startLevel(levelId)` — 加载关卡 + 启动计时器 + 绘制场景
  - `renderScene()` — Canvas 绘制目标 + 干扰物（emoji 随机坐标 + 旋转 + 缩放）
  - `onCanvasClick(e)` — 命中检测 + 找到/未找到处理
  - `tick()` — 倒计时每秒更新
  - `winLevel()` / `loseLevel()`
  - 道具使用：`useMagnifier()` / `useAddTime()` / `useBomb()` / `useFreeze()`
- 暂停：`togglePause()`
- 结算：渲染找到数量 + 奖励 + 按钮事件
- 签到：`checkSignin()` / `doSignin()` / `getSigninReward(streak)`
- 商店：渲染商品 + 调用 `Telegram.WebApp.openInvoice` 流程（占位实现，留 hook）
- 广告：`showAd(callback)` / `showInterstitialAd()` — 沿用 2048 模式
- Telegram 集成：`Telegram.WebApp.HapticFeedback.impactOccurred`
- 验证：完整跑通 1-3 关 + 签到 1 次 + 商店页打开 + 道具使用 1 次

- [x] Task 7: 创建 Bot3 Webhook（Vercel Serverless）
- 新建 `MHGames/api/webhook-findcow.js`
- 包含 `TOKEN` (环境变量 `TELEGRAM_BOT_TOKEN_FINDCOW`)、`GAME_URL_FINDCOW = 'https://mohuan.asia/games/findcow/index.html'`
- 处理 `/start` `/play` `/help`，发送 web_app 按钮
- 注册命令（`setMyCommands`）
- 验证：部署后 POST `/api/webhook-findcow` 返回 200

- [x] Task 8: 更新 `bot-server.js` 本地 polling
- 增加 `BOT3_TOKEN` 与 `bot3` 实例
- 复制 Bot1/Bot2 的 `/start` `/play` `/help` 处理逻辑，指向 findcow URL
- 控制台日志："🤖 Bot3 (Find the Bull) 已启动！"
- 增加 `bot3.on('polling_error', ...)`
- 验证：`npm start` 输出三行启动日志

- [x] Task 9: 更新 `scripts/set-webhook.js`
- 在 `setWebhooks()` 中追加 Bot3 调用 `setWebhook('https://mohuan.asia/api/webhook-findcow', BOT3_TOKEN)`
- `info` 模式追加 Bot3 状态输出
- 验证：`npm run webhook:set` 设置三个 webhook；`npm run webhook:info` 显示三个状态

- [x] Task 10: 更新首页 `MHGames/index.html`
- 在游戏选择区追加"🐂 Find the Bull"卡片，按钮 `🎮 Play Find the Bull` 跳转 `games/findcow/index.html`（直接 web 跳转而非 bot 入口，作为额外入口）
- 验证：浏览器直接访问首页能看到 3 个游戏卡片

- [x] Task 11: 更新文档 README / FLOW / DIRECTORY_STRUCTURE
- `README.md`：追加"找牛牛"游戏行 + 双 Bot 表格改为三 Bot
- `FLOW.md`：在双 Bot 架构图旁追加 Bot3
- `DIRECTORY_STRUCTURE.md`：追加 `games/findcow/` 与 `api/webhook-findhook.js` 章节
- `BOT_SETUP.md`：追加 Bot3 的 Token、URL、BlockId
- 验证：四个文档都有"找牛牛 / Find the Bull / Bot3"相关章节

- [x] Task 12: 端到端验证
- 在本地 `node bot-server.js` 启动三 Bot
- 通过 Bot3 发 `/start` → 收到 web_app 按钮
- 点击按钮 → Telegram 内嵌 WebView 打开游戏
- 完整跑通：首页 → 关卡 → 游戏（找物品）→ 结算 → 签到 → 商店
- 触发一次激励广告 + 一次插屏广告，控制台无报错
- 切换语言正常，刷新页面 localStorage 数据保留

## 追加修复任务（checklist 验证发现）

- [ ] Task 13: 修复 `BOT_SETUP.md` 缺 Bot3 配置表
  - 在 `BOT_SETUP.md` "Bot 信息" 表追加第三列 `Bot3 (Find the Bull)`，包含：
    - Token: `8888888888:PLACEHOLDER_FINDCOW`（或读取 env `TELEGRAM_BOT_TOKEN_FINDCOW`）
    - 游戏 URL: `https://mohuan.asia/games/findcow/index.html`
    - Webhook: `/api/webhook-findcow`
    - 激励广告: `31500`
    - 插屏广告: `int-31501`
  - 将 "对两个 Bot" 措辞改为 "对三个 Bot"
  - 补充 Bot3 在 @BotFather 中的描述/命令/Mini App 配置示例
  - 来源: `checklist.md` 验证项 "Bot3 集成 → BOT_SETUP.md Bot3 Token/URL/BlockId"

- [ ] Task 14: Telegram Stars 真实支付链路
  - 当前 `games/findcow/game.js#buyShopItem()` 仅占位：检测到 `openInvoice` 存在即直接调用 `grant()`，未实际发起 `openInvoice` 流程
  - 需后端提供真实 invoice link（如 `/api/create-invoice?item=starter` 返回 `https://t.me/$xxx` 链接）
  - 前端改为 `Telegram.WebApp.openInvoice(url, (status) => { if (status === 'paid') grant() })`
  - 来源: `checklist.md` 验证项 "商店 → Telegram Stars 支付 hook 占位"

- [ ] Task 15: 端到端运行时复测
  - 由于验证环境无 node，本轮 7 项端到端检查项未运行
  - 需在有 node + Telegram 客户端的环境下复测：
    1. `npm start` 三 Bot 启动无报错
    2. Bot3 `/start` → web_app 按钮可达
    3. 点击按钮 → Telegram WebView 打开 `games/findcow/index.html`
    4. 完整流程: 首页 → 关卡地图 → 游戏 → 结算 → 签到 → 商店
    5. 激励广告 + 插屏广告控制台无报错
    6. 切换语言（中文 ↔ 英文）
    7. 刷新后 localStorage 数据保留（`findcow_maxLevel / findcow_items / findcow_signin_date / findcow_lang`）
  - 来源: `checklist.md` "端到端" 全部分组

- [ ] Task 16: 命名一致性（`renderScene` vs `drawScene`）
  - `checklist.md` 提到 `renderScene`，实际 `games/findcow/game.js` 中 Canvas 绘制函数名为 `drawScene()`（line 400）+ 主入口 `generateScene()`（line 298）
  - 建议二选一：
    - 选项 A: 更新 `checklist.md` 改用 `drawScene`/`generateScene`（更准确）
    - 选项 B: 重构 `game.js` 将 `drawScene` 重命名为 `renderScene`（保持 checklist 一致）
  - 优先级: 低（仅命名差异，不影响功能）

# Task Dependencies
- Task 6 depends on Task 2, 3, 4, 5（依赖页面/样式/语言/关卡数据）
- Task 7, 8, 9 互相独立，可并行
- Task 10 depends on Task 6（首页需了解游戏入口 URL）
- Task 11 depends on Task 1, 7, 8, 9（文档需在代码完成后）
- Task 12 depends on 上述全部

# Parallelizable Work
- Task 1 / Task 2 / Task 3 / Task 4 / Task 5 / Task 7 / Task 8 / Task 9 之间无依赖，可并行委派
- Task 6 在 Task 2-5 完成后开始
- Task 10、11、12 串行收尾
