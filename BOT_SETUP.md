# 🤖 墨焕游戏Bot设置指南

## 📋 第一步：完成游戏注册（在 BotFather 中）

在 Telegram 中打开 @BotFather，继续完成游戏注册：

### 注册第一个游戏（2048）
```
/newgame
```
然后按照提示：
1. 选择你的Bot
2. 游戏标题：`2048霓虹灯版`
3. 游戏描述：`经典的2048游戏，霓虹灯风格！`
4. 上传封面图（512x512像素 PNG/JPG）
5. 游戏简称：`neon2048`
6. 游戏URL：`https://www.mohuan.asia/games/2048/`

### 注册第二个游戏（粒子消除）
```
/newgame
```
1. 游戏标题：`粒子消除`
2. 游戏描述：`点击消除相同颜色的粒子，挑战高分！`
3. 上传封面图
4. 游戏简称：`particleblast`
5. 游戏URL：`https://www.mohuan.asia/games/particle/`

---

## 🚀 第二步：安装并运行Bot

### 1. 安装依赖
在 `TelegramGames` 目录下打开终端：
```bash
npm install
```

### 2. 启动Bot
```bash
npm start
```

你会看到：
```
🤖 墨焕游戏Bot已启动！
✨ Bot已准备好，等待消息！
```

### 3. 测试Bot
在 Telegram 中：
1. 找到你的Bot
2. 发送 `/start`
3. 发送 `/neon2048` 或 `/particle`
4. 点击"开始游戏"按钮测试

---

## 🔧 第三步：修改游戏URL（如需要）

如需更新游戏URL，在 BotFather 中：

```
/mygames
```
选择你的游戏 → `Edit game` → `Edit game URL`

设置为：
- `neon2048`: `https://www.mohuan.asia/games/2048/`
- `particleblast`: `https://www.mohuan.asia/games/particle/`

---

## 📝 Bot功能说明

### 命令
- `/start` - 欢迎消息和游戏列表
- `/neon2048` - 发送2048游戏
- `/particle` - 发送粒子消除游戏

### 内联查询
在任何聊天中输入：
`@MoHuanGamesBot`
然后选择游戏发送！

---

## 📦 项目结构
```
TelegramGames/
├── bot-server.js          # Bot服务器
├── package.json           # 项目配置
├── index.html             # 游戏首页
├── games/
│   ├── 2048/             # 2048游戏
│   └── particle/         # 粒子消除游戏
└── BOT_SETUP.md          # 本文档
```
