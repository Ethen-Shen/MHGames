# Checklist — 找牛牛 (Find the Bull) 游戏

## Spec 完整性
- [x] spec.md 包含 Why / What Changes / Impact / ADDED Requirements / Scenarios
- [x] tasks.md 包含 12 个有序任务 + 依赖关系
- [x] 本 checklist 覆盖所有验收要点

## 游戏目录与配置
- [x] `MHGames/games/findcow/` 目录创建
- [x] `game.json` 包含 platform/name/version/description
- [x] `minigame.config.json` 包含 platform/name

## 页面与导航
- [x] 首页 `#/home` 展示开始游戏/签到/商店/设置 4 个入口
- [x] 关卡地图 `#/levels` 渲染 30+ 关卡节点
- [x] 游戏页 `#/game` 顶部物品列表 + 计时器 + Canvas + 道具栏
- [x] 暂停页 `#/pause` 继续/重玩/回首页
- [x] 结算页 `#/result` 通关/失败两种状态
- [x] 商店页 `#/shop` 3 个商品包
- [x] 签到页 `#/signin` 7 天奖励
- [x] 设置页 `#/settings` 语言切换 + 关于

## 游戏核心玩法
- [x] Canvas 渲染场景（emoji 阵列）— `game.js#drawScene()`（命名差异已在 Task 16 记录）
- [x] 命中检测正确（点击目标划掉列表）
- [x] 点击未命中抖动反馈
- [x] 倒计时逻辑正常
- [x] 通关发放 1⭐，失败显示找到数量
- [x] 关卡进度持久化（localStorage `findcow_maxLevel`）

## 道具系统
- [x] 4 种道具：🔍 ⏰ 💣 ❄️
- [x] 道具数量持久化（localStorage `findcow_items`）
- [x] 使用道具逻辑（放大镜高亮/加时/排除/冰冻）
- [x] 道具不足弹窗 + 跳转商店
- [x] 看广告获取道具入口

## 每日签到
- [x] 7 天循环奖励表正确
- [x] 今日已签到按钮置灰
- [x] 签到发放奖励 + 写入日期
- [x] 断签 48h 重置 streak

## 商店
- [x] 3 个商品包价格正确（1⭐ / 3⭐ / 8⭐）
- [~] Telegram Stars 支付 hook 占位（需要后端 invoice 链接，见 Task 14）
- [x] 支付成功后道具入账

## 广告集成
- [x] `<head>` 中加载 `sad.min.js`
- [x] `Telegram.WebApp.ready()` + `expand()` 调用一次
- [x] `Adsgram.init({ blockId: "31500" })` 激励
- [x] `Adsgram.init({ blockId: "int-31501" })` 插屏
- [x] `showAd(callback)` 沿用 `result.done === true` 给奖励
- [x] `showInterstitialAd()` 在结算页触发

## 多语言
- [x] `lang.js` 包含 zh / en 两套文案
- [x] `data-i18n` 元素文案随语言切换
- [x] 语言选择持久化

## Bot3 集成
- [x] `api/webhook-findcow.js` 创建
- [x] 处理 `/start` `/play` `/help` 发送 web_app 按钮
- [x] `bot-server.js` 启动 Bot3
- [x] `scripts/set-webhook.js` 设置 Bot3 webhook
- [x] `npm run webhook:info` 显示三个 webhook

## 首页与文档
- [x] `MHGames/index.html` 追加找牛牛卡片
- [x] `README.md` 更新（找牛牛行 + 三 Bot 表格）
- [x] `FLOW.md` 三 Bot 架构图
- [x] `DIRECTORY_STRUCTURE.md` 追加 findcow 章节
- [x] `BOT_SETUP.md` Bot3 Token/URL/BlockId

## 端到端（需在有 node + Telegram 客户端的环境复测）
- [ ] `npm start` 启动三 Bot 无报错
- [ ] Bot3 `/start` 收到 web_app 按钮
- [ ] 点击按钮在 Telegram WebView 打开游戏
- [ ] 完整流程：首页 → 关卡 → 游戏 → 结算 → 签到 → 商店
- [ ] 激励广告 + 插屏广告控制台无报错
- [ ] 切换语言正常
- [ ] 刷新后 localStorage 数据保留
