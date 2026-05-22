# 🤖 墨焕游戏 Bot 设置指南

> ⏰ 最后更新: 2026-05-22
> 
> 🏷️ 版本: v2.0

---

## 📋 第一步：完成游戏注册（在 BotFather 中）

在 Telegram 中打开 [@BotFather](https://t.me/BotFather)，继续完成游戏注册。

### 注册第一个游戏（2048 霓虹版）

1. 发送 `/newgame` 到 BotFather
2. 按提示操作：
   - 选择你的 2048 机器人
   - 游戏标题：`2048 霓虹灯版`
   - 游戏描述：`经典的 2048 游戏，霓虹灯风格！`
   - 上传封面图（512x512 像素 PNG/JPG）
   - 游戏简称：`neon2048`
   - 游戏 URL：`https://www.mohuan.asia/games/2048/`

### 注册第二个游戏（粒子消除）

1. 发送 `/newgame` 到 BotFather
2. 按提示操作：
   - 选择你的粒子消除机器人
   - 游戏标题：`粒子消除`
   - 游戏描述：`点击消除相同颜色的粒子，挑战高分！`
   - 上传封面图（512x512 像素 PNG/JPG）
   - 游戏简称：`particleblast`
   - 游戏 URL：`https://www.mohuan.asia/games/particle/`

---

## 🚀 第二步：安装并运行 Bot

### 1. 安装依赖

在 `TelegramGames` 目录下打开终端：

```bash
npm install
```

### 2. 启动 Bot

```bash
npm start
```

你会看到：
```
🤖 墨焕游戏 Bot 已启动！
✨ Bot 已准备好，等待消息...
```

### 3. 测试 Bot

在 Telegram 中：
1. 找到你的 Bot
2. 发送 `/start`
3. 发送 `/neon2048` 或 `/particle`
4. 点击"开始游戏"按钮测试

---

## 🤖 Bot 配置信息 (v2.0)

### Bot 1: 2048 霓虹版

| 项目 | 值 |
|------|-----|
| 机器人 Token | `8009269765:AAFWy0fA46S6KqE7jFb34zG6rV7Y9x2c4vB` |
| 命令 | `/start`, `/game2048`, `/neon2048` |
| 游戏 URL | `https://www.mohuan.asia/games/2048/` |
| 游戏简称 | `neon2048` |
| 激励广告 ID | `31225` |
| 插屏广告 ID | `int-30882` |

### Bot 2: 粒子消除

| 项目 | 值 |
|------|-----|
| 机器人 Token | `7878694710:AAGX57m4dM3Ryv3bWc6rD9e2kL8pG5hJ1nQ` |
| 命令 | `/start`, `/particle`, `/particleblast` |
| 游戏 URL | `https://www.mohuan.asia/games/particle/` |
| 游戏简称 | `particleblast` |
| 激励广告 ID | `30885` |
| 插屏广告 ID | `int-30886` |

---

## 🔧 第三步：修改游戏 URL（如需要）

如需更新游戏 URL，在 BotFather 中：

```
/mygames
```

选择你的游戏 → `Edit game` → `Edit game URL`

设置为：
- 2048 霓虹版: `https://www.mohuan.asia/games/2048/`
- 粒子消除: `https://www.mohuan.asia/games/particle/`

---

## 📝 Bot 功能说明

### 命令

| 命令 | 说明 | 适用 Bot |
|------|------|---------|
| `/start` | 欢迎消息和游戏列表 | 两个 Bot |
| `/neon2048` 或 `/game2048` | 发送 2048 游戏 | 2048 Bot |
| `/particle` 或 `/particleblast` | 发送粒子消除游戏 | 粒子消除 Bot |

### 内联查询

在任何聊天中输入：
- `@你的2048Bot用户名` - 选择并发送 2048 游戏
- `@你的粒子Bot用户名` - 选择并发送粒子消除游戏

---

## 📦 项目结构 (v2.0 更新)

```
TelegramGames/
├── bot-server.js              # Bot 服务端（本地运行）
├── package.json               # 项目配置
├── index.html                 # 首页
├── games/
│   ├── 2048/                 # 2048 游戏 ⭐ v2.0 更新
│   │   ├── index.html       # 移除背景动画，优化广告
│   │   └── game.js          # 优化广告逻辑
│   └── particle/             # 粒子消除游戏 ⭐ v2.0 更新
│       ├── index.html       # 移除背景动画，优化广告
│       └── game.js          # 移除粒子爆炸，优化广告
├── api/
│   └── webhook.js           # Webhook 处理
└── BOT_SETUP.md              # 本文件
```

---

## 🎮 v2.0 游戏重要更新

### 1. 广告系统优化

✅ **AdsGram 初始化问题修复**
- 添加 Telegram 环境检测
- 非 Telegram 环境不初始化广告
- 广告失败时直接给奖励

✅ **广告显示逻辑优化**
- 15秒超时保护
- 错误自动降级处理
- 不阻塞游戏流程

### 2. 性能优化

✅ **移除背景动画**
- 删除 2048 游戏的下落数字背景
- 删除粒子消除的下落方块背景
- 大幅提升游戏流畅度

✅ **简化粒子效果**
- 移除粒子消除的爆炸粒子动画
- 改为简单的方块下落动画
- 减少渲染负担

---

## 🧪 测试清单 (v2.0)

### Bot 功能测试
- [ ] `/start` 命令正常工作
- [ ] `/neon2048` 命令发送游戏
- [ ] `/particle` 命令发送游戏
- [ ] 点击游戏按钮能正常打开 Web App

### 2048 游戏测试
- [ ] 游戏流畅，无背景动画
- [ ] 点击"撤销"按钮，广告显示或直接给奖励
- [ ] 点击"提示"按钮，广告显示或直接给奖励
- [ ] 浏览器控制台无 AdsGram 错误

### 粒子消除游戏测试
- [ ] 游戏流畅，无背景动画
- [ ] 消除效果简单，无爆炸粒子
- [ ] 游戏结束后点击"复活"，广告显示或直接给奖励
- [ ] 浏览器控制台无 AdsGram 错误

---

## 📝 代码更新位置

### Bot 相关
- `bot-server.js` - 本地运行的 Bot 服务
- `api/webhook.js` - Vercel Webhook 处理

### 游戏相关（v2.0 更新）
- `games/2048/index.html` - 广告初始化
- `games/2048/game.js` - 广告显示逻辑
- `games/particle/index.html` - 广告初始化
- `games/particle/game.js` - 广告显示逻辑

---

## 🆘 常见问题

### 问题 1：Webhook 不工作

1. 运行 `npm run webhook:info` 检查状态
2. 确认 Vercel 部署成功
3. 查看 Vercel 日志

### 问题 2：游戏打开后没有广告

1. 确认在 Telegram 客户端内打开
2. 检查 AdsGram Block ID 是否正确
3. v2.0 中，广告不显示时会直接给奖励，这是正常的降级机制

### 问题 3：游戏卡顿

✅ v2.0 已修复！已移除背景动画和粒子爆炸效果，游戏应该很流畅。

---

## 📖 相关文档

- [README.md](./README.md) - 项目总体说明
- [DIRECTORY_STRUCTURE.md](./DIRECTORY_STRUCTURE.md) - 目录结构详解
- [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md) - 部署指南

---

## 🎉 完成!

v2.0 版本的 Bot 和游戏都已优化完成：
- 🛡️ 广告系统更稳定
- 🚀 游戏性能大幅提升
- 📱 用户体验更好
