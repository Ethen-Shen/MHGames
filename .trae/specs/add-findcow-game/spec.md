# 找牛牛 (Find the Bull) 游戏 Spec

## Why
墨焕游戏平台目前只有 2048 和粒子消除两款休闲游戏，需要扩充一个"找牛牛"（找茬/找物品）类型的休闲游戏，丰富平台内容并通过新游戏的道具/签到系统增加广告变现点。找牛玩法以"在限定时间内从杂乱场景中找到指定物品"为核心，规则简单、上手快、复玩性高，且与现有两款游戏在玩法上互补。

## What Changes
- 新增第三款游戏 `games/findcow/`（HTML5 + Vanilla JS + Canvas）
- 新增 Bot3（Find the Bull Bot）独立 Webhook `/api/webhook-findcow`
- 更新 `bot-server.js`、新增 `api/webhook-findcow.js`、更新 `scripts/set-webhook.js`
- 玩法核心：每关给出一张"物品列表"（如 🐂🐄🐃🐮 等 5-8 个），玩家在限定时间内在复杂场景中点击目标物品，找到所有物品过关
- 道具系统（消耗型）
  - 🔍 放大镜：点选后短暂高亮某区域的目标物品（看广告获取）
  - ⏰ 时间 +15s：增加 15 秒时间（看广告获取）
  - 💣 排除炸弹：自动消除一个错误干扰物（看广告获取）
  - ❄️ 冰冻：暂停计时器 10 秒（看广告获取）
- 每日签到：连续 7 天领取不同奖励（道具 / 金币 / 星星）
- 商店：用 Telegram Stars 购买道具包
- 包含完整的页面：首页 / 关卡地图 / 游戏页 / 商店 / 签到 / 设置 / 暂停 / 结算
- 中英文双语（沿用 lang.js 模式）
- 接入 AdsGram 激励+插屏广告（新增 BlockId 占位 `31500` / `int-31501`，可后续替换）

## Impact
- Affected specs: 暂无（新增能力）
- Affected code:
  - `MHGames/bot-server.js` — 新增 Bot3 启动与命令
  - `MHGames/api/webhook-findcow.js` — 新建（Bot3 webhook）
  - `MHGames/scripts/set-webhook.js` — 追加 Bot3 webhook 设置
  - `MHGames/index.html` — 首页追加"找牛牛"入口卡片
  - `MHGames/README.md` / `FLOW.md` / `DIRECTORY_STRUCTURE.md` — 文档更新
  - `MHGames/games/findcow/` — 新建目录

## Gameplay Design

### 核心规则
1. 进入关卡后展示一张 1080×1920 的"牛群场景图"（用 Canvas 绘制或 emoji 阵列生成）
2. 顶部显示"本关要找的物品列表"（5-8 个 emoji）
3. 玩家在限定时间内（基础 60 秒）点击场景中匹配的目标
4. 点中目标：列表中对应物品划掉，播放音效 + 震动
5. 点错位置：抖动反馈
6. 全部找到：本关通过 + 1⭐，进入下一关
7. 时间到：游戏结束，弹结算页

### 关卡结构（30+ 关）
- 关卡 1-10：新手（找 4 个物品，60s，场景元素少）
- 关卡 11-20：普通（找 6 个物品，50s，场景元素多）
- 关卡 21-30：困难（找 8 个物品，40s，场景更密集）
- 关卡 31+：无尽模式（系统随机生成）

### 道具
| 道具 | 效果 | 获取 |
|------|------|------|
| 放大镜 🔍 | 3 秒内高亮一个未找目标 | 看广告 / 签到 / Stars 购买 |
| 加时 ⏰ | +15s | 看广告 / 签到 / Stars 购买 |
| 排除 💣 | 自动标错一个干扰项 | 看广告 / 签到 / Stars 购买 |
| 冰冻 ❄️ | 暂停计时 10s | 看广告 / 签到 / Stars 购买 |

### 每日签到
7 天循环奖励表：
- Day1: 🔍×1
- Day2: ⏰×1
- Day3: 💣×1
- Day4: 🔍×2
- Day5: ❄️×1
- Day6: ⏰×2 + 💣×1
- Day7: 大礼包（每种×3 + 5⭐）

### 商店
3 个商品包（用 Telegram Stars 支付，沿用现有 Stars 模式）：
- 新手包（1⭐）：🔍×2 + ⏰×1
- 进阶包（3⭐）：🔍×3 + ⏰×2 + 💣×2
- 豪华包（8⭐）：所有道具×5 + 跳过当前关卡券×1

## ADDED Requirements

### Requirement: Game Pages & Navigation
系统 SHALL 提供以下页面（单页应用，hash 路由或显隐切换）：
- `#/home` 首页（开始游戏、签到入口、商店入口、设置入口、最高关卡展示）
- `#/levels` 关卡地图（线性展示已解锁关卡，点击进入）
- `#/game` 游戏页（顶部物品列表 + 计时器 + Canvas 场景 + 道具栏 + 暂停按钮）
- `#/shop` 商店（道具包列表 + Stars 购买）
- `#/signin` 每日签到（7 天奖励卡片 + 今日签到按钮）
- `#/pause` 暂停遮罩（继续 / 重玩 / 回首页）
- `#/result` 结算页（通关 / 失败两种状态 + 道具奖励 + 下一关 / 重玩 / 回首页）

#### Scenario: 用户首次进入应用
- **WHEN** 用户通过 Telegram Bot 的 web_app 按钮打开游戏
- **THEN** 首页加载并展示"开始游戏""签到""商店""设置"四个入口；最高关卡显示为 1

#### Scenario: 用户通关后
- **WHEN** 用户在游戏中找到所有目标物品
- **THEN** 自动播放庆祝动画 + 弹出"通关"提示 + 1⭐ 入账 + 跳转到结算页

#### Scenario: 用户时间耗尽
- **WHEN** 倒计时归零且未找完所有物品
- **THEN** 弹结算页，显示"失败"+ 找到数量 / 总数 + 选项：看广告复活 / 重玩 / 回首页

### Requirement: Find-the-Bull Core Gameplay
系统 SHALL 在 Canvas 上渲染"牛群场景"，并支持点击命中检测。

#### Scenario: 点击命中目标
- **WHEN** 用户点击坐标落在目标物品的 hit-box 内
- **THEN** 物品从场景移除，列表划掉，播放"叮"音效，Telegram WebApp 触发 `HapticFeedback.impactOccurred('light')`

#### Scenario: 点击未命中
- **WHEN** 用户点击坐标未命中任何目标
- **THEN** 播放"miss"音效 + 屏幕红边抖动 + 不消耗时间

#### Scenario: 找完最后一个目标
- **WHEN** 列表全部划掉
- **THEN** 停止计时器，结算页显示"通关"，发放 1⭐ 奖励

### Requirement: Levels & Progress
系统 SHALL 持久化用户最高关卡（`localStorage.findcow_maxLevel`），已通关关卡可重玩。

#### Scenario: 首次进入
- **WHEN** localStorage 中无 `findcow_maxLevel`
- **THEN** 最高关卡初始化为 1，关卡地图只解锁关卡 1

#### Scenario: 通关后回地图
- **WHEN** 用户通关关卡 N
- **THEN** localStorage 更新 `findcow_maxLevel = N+1`，地图上关卡 N+1 解锁

### Requirement: Items / Props
系统 SHALL 维护玩家拥有的道具数量（`localStorage.findcow_items`），并支持使用。

#### Scenario: 玩家使用放大镜
- **WHEN** 玩家在游戏页点击 🔍 按钮
- **THEN** 弹确认 → 道具数量 -1 → 3 秒内随机一个未找目标位置出现黄色光圈高亮

#### Scenario: 玩家使用加时
- **WHEN** 玩家点击 ⏰ 按钮
- **THEN** 弹确认 → 道具数量 -1 → 剩余时间 +15s

#### Scenario: 道具不足
- **WHEN** 玩家点击道具但数量为 0
- **THEN** 弹窗提示"道具不足" + 跳转商店或看广告获取按钮

### Requirement: Daily Check-in
系统 SHALL 跟踪 7 天签到周期并发放奖励。

#### Scenario: 今日已签到
- **WHEN** `localStorage.findcow_signin_date` 等于今日日期
- **THEN** 签到页"今日签到"按钮置灰，显示"已签到"

#### Scenario: 今日未签到
- **WHEN** `localStorage.findcow_signin_date` 不等于今日日期
- **THEN** 签到按钮可点击，点击后发放当日奖励 + 写入今日日期 + `findcow_signin_streak` +1

#### Scenario: 断签重置
- **WHEN** 距上次签到超过 48 小时
- **THEN** `findcow_signin_streak` 重置为 1

### Requirement: Shop & Stars Payment
系统 SHALL 提供 3 个道具包供玩家用 Telegram Stars 购买。

#### Scenario: 玩家购买新手包
- **WHEN** 玩家点击"新手包 1⭐"按钮
- **THEN** 调用 `Telegram.WebApp.openInvoice()`（沿用现有 Stars 支付流程），支付成功后道具入账

### Requirement: Ads Integration
系统 SHALL 在 `<head>` 中按规范加载 AdsGram SDK 并初始化。

#### Scenario: 激励广告场景
- **WHEN** 玩家点击"看广告 +15s"或"看广告获得道具"
- **THEN** 调用 `adReward.show()`，回调中 `result.done === true` 时执行奖励

#### Scenario: 插屏广告场景
- **WHEN** 关卡结束（无论通关或失败）
- **THEN** 调用 `adInterstitial.show()`，不阻塞游戏继续

### Requirement: Bilingual (zh/en)
系统 SHALL 通过 `lang.js` 提供中英文切换。

#### Scenario: 切换语言
- **WHEN** 用户在设置页选择 English
- **THEN** `localStorage.findcow_lang = 'en'`，页面文案切换为英文

## MODIFIED Requirements

### Requirement: Bot Entry Point (Modified)
现有 `bot-server.js` 同时跑两个 Bot。**扩展**为支持第三个 Bot（Bot3）：

#### Scenario: 启动双 Bot 改为三 Bot
- **WHEN** 执行 `npm start`
- **THEN** 控制台输出三个 Bot 的启动日志

### Requirement: Webhook Architecture (Modified)
现有 `/api/webhook` 和 `/api/webhook-greedysnakes`。**追加** `/api/webhook-findcow` 作为 Bot3 端点。

## REMOVED Requirements
无（纯新增能力，不影响现有 2048 / Particle 逻辑）。

## Out of Scope
- 真实美术资源（先用 emoji 阵列 + Canvas 绘制占位，后续可替换 SVG/PNG）
- 后端账号系统（暂用 localStorage）
- 关卡编辑器（关卡数据硬编码在 `levels.js`）
- 排行榜（v1 暂不上）
