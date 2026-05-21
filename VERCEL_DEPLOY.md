# 🚀 Vercel 部署和 Webhook 设置指南

## 📋 前提条件

✅ 你已经完成的：
- Git 仓库已连接到 Vercel
- 项目已成功部署（`www.mohuan.asia`）
- 域名配置完成

---

## 🎯 第一步：提交新代码到 GitHub

先把我们新创建的文件提交到 GitHub：

```bash
# 查看更改
git status

# 添加新文件
git add vercel.json
git add api/
git add scripts/
git add package.json

# 提交
git commit -m "chore: 添加 Vercel Webhook 支持"

# 推送到 GitHub
git push
```

Vercel 会自动重新部署！

---

## 🔌 第二步：设置 Telegram Webhook

部署成功后，在本地运行 Webhook 设置脚本：

### 1️⃣ 安装依赖（如果还没安装）
```bash
npm install
```

### 2️⃣ 设置 Webhook
```bash
npm run webhook:set
```

你会看到类似这样的输出：
```
🔗 设置 Telegram Bot Webhook...
📡 Webhook URL: https://www.mohuan.asia/api/webhook
✅ Webhook 设置成功！
📋 结果: { ok: true, result: true, ... }
```

### 3️⃣ 查看 Webhook 状态（可选）
```bash
npm run webhook:info
```

---

## 🧪 第三步：测试机器人

1. **打开 Telegram**
2. **找到你的机器人**
3. **发送 `/start`** - 应该会收到欢迎消息
4. **发送 `/neon2048`** - 应该会收到游戏
5. **点击"开始游戏"** - 应该会打开游戏

---

## 📁 我们创建的新文件

| 文件 | 说明 |
|------|------|
| `vercel.json` | Vercel 配置文件 |
| `api/webhook.js` | Telegram Webhook 处理 |
| `scripts/set-webhook.js` | Webhook 设置脚本 |

---

## ⚙️ 在 Vercel 后台设置环境变量（可选）

虽然我们已经把 Token 放在代码中了，但更安全的做法是：

1. **打开 Vercel 项目设置**
2. **进入 Environment Variables**
3. **添加变量**：
   - Name: `TELEGRAM_BOT_TOKEN`
   - Value: `8979472034:AAF4E2qOXRiTsZWjlX5Kepxb47Eyy_QvHwk`
4. **重新部署**

---

## 📝 检查清单

部署完成后，检查以下项目：

- [ ] 新代码已推送到 GitHub
- [ ] Vercel 自动重新部署成功
- [ ] Webhook 已设置（运行 `npm run webhook:info` 确认）
- [ ] 机器人 `/start` 命令工作正常
- [ ] 游戏可以正常打开
- [ ] AdsGram 广告位置已预留（等 BlockId 后更新）

---

## 🔄 等拿到 AdsGram BlockId 后

在以下两个文件中替换：
1. `games/2048/index.html` - 第 148 行
2. `games/particle/index.html` - 第 116 行

```javascript
blockId: "你的真实BlockId"
```

然后重新提交和部署！

---

## 🆘 常见问题

### 问题 1：机器人不回复
- 检查 Webhook 是否正确设置：`npm run webhook:info`
- 查看 Vercel 日志中是否有错误

### 问题 2：Webhook 设置失败
- 确认域名是 HTTPS
- 确认 API 路由已正确部署

### 问题 3：游戏打不开
- 确认游戏文件已上传到 `games/` 目录
- 检查 Vercel 部署日志
