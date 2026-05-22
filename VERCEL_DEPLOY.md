# 🚀 Vercel 部署和 Webhook 设置指南

> ⏰ 最后更新: 2026-05-22
> 
> 🏷️ 版本: v2.0

---

## 📋 前提条件

✅ 你已完成：
- Git 仓库已连接到 Vercel
- 项目已成功部署（`https://www.mohuan.asia`）
- 域名配置完成

---

## 🎯 第一步：提交新代码到 GitHub

将 v2.0 更新的代码提交到 GitHub：

```bash
# 查看更改
git status

# 添加新文件
git add games/2048/index.html
git add games/2048/game.js
git add games/particle/index.html
git add games/particle/game.js
git add README.md
git add DIRECTORY_STRUCTURE.md
git add VERCEL_DEPLOY.md
git add BOT_SETUP.md

# 提交
git commit -m "v2.0: 修复AdsGram初始化问题，移除背景动画优化性能"

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

## 📁 关键文件说明

| 文件 | 说明 | 最新版本 |
|------|------|---------|
| `vercel.json` | Vercel 配置文件 | v2.0 |
| `api/webhook.js` | Telegram Webhook 处理 | v2.0 |
| `scripts/set-webhook.js` | Webhook 设置脚本 | v2.0 |

---

## ⚙️ 在 Vercel 后台设置环境变量（可选）

虽然我们把 Token 放在代码中了，但更安全的做法是：

1. 打开 Vercel 项目设置
2. 进入 Environment Variables
3. 添加变量：
   - Name: `TELEGRAM_BOT_TOKEN_2048`
   - Value: `8009269765:AAFWy0fA46S6KqE7jFb34zG6rV7Y9x2c4vB`
   
   - Name: `TELEGRAM_BOT_TOKEN_PARTICLE`
   - Value: `7878694710:AAGX57m4dM3Ryv3bWc6rD9e2kL8pG5hJ1nQ`
4. 重新部署

---

## 📝 检查清单 (v2.0)

部署完成后，检查以下项目：

- [ ] 新代码已推送到 GitHub
- [ ] Vercel 自动重新部署成功
- [ ] Webhook 已设置（运行 `npm run webhook:info` 确认）
- [ ] 机器人 `/start` 命令工作正常
- [ ] 游戏可以正常打开
- [ ] **2048 游戏测试**：
  - [ ] 无背景动画，游戏流畅
  - [ ] 点击撤销/提示，广告能正常显示或直接给奖励
  - [ ] 浏览器控制台无 AdsGram 初始化错误
- [ ] **粒子消除游戏测试**：
  - [ ] 无背景动画，无爆炸粒子，游戏流畅
  - [ ] 点击复活，广告能正常显示或直接给奖励
  - [ ] 浏览器控制台无 AdsGram 初始化错误

---

## 🔧 v2.0 更新后的 AdsGram 配置

### 广告 Block ID

| 游戏 | 激励广告 | 插屏广告 |
|------|---------|---------|
| 2048 霓虹版 | `31225` | `int-30882` |
| 粒子消除 | `30885` | `int-30886` |

### 广告逻辑说明

1. **环境检测**：游戏会先检查是否在 Telegram WebApp 环境
2. **降级处理**：非 Telegram 环境或广告初始化失败 → 直接给予奖励
3. **超时保护**：15秒超时，超时后直接给奖励
4. **错误处理**：广告加载失败不阻塞游戏，直接继续

### 常见错误修复

#### 错误：`AdsgramError: Unable to retrieve launch parameters`

✅ 已修复！v2.0 添加了环境检测：
- 如果不在 Telegram 环境，跳过广告初始化
- 广告显示时再次检测，自动降级处理

#### 游戏卡顿问题

✅ 已修复！v2.0：
- 完全移除了背景 Canvas 动画
- 简化了粒子消除的爆炸效果
- 游戏性能大幅提升

---

## 🆘 常见问题

### 问题 1：机器人不回复

1. 检查 Webhook 是否正确设置：`npm run webhook:info`
2. 查看 Vercel 日志中是否有错误
3. 确认域名是 HTTPS

### 问题 2：Webhook 设置失败

1. 确认域名是 HTTPS
2. 确认 API 路由已正确部署
3. 检查 Vercel 日志

### 问题 3：游戏打不开

1. 确认游戏文件已上传到 `games/` 目录
2. 检查 Vercel 部署日志
3. 确认 `index.html` 路径正确

### 问题 4：广告不显示

1. 确认在 Telegram 客户端内打开游戏
2. 检查浏览器控制台是否有错误
3. v2.0 中，广告不显示时会直接给奖励，不影响游戏体验

---

## 📊 部署验证

部署成功后，访问以下链接验证：

- 首页: https://www.mohuan.asia/
- 2048 游戏: https://www.mohuan.asia/games/2048/
- 粒子消除: https://www.mohuan.asia/games/particle/
- 隐私政策: https://www.mohuan.asia/privacy.html
- 服务条款: https://www.mohuan.asia/terms.html

---

## 🎉 完成!

v2.0 版本部署后，你将获得：
- 🚀 更流畅的游戏体验（无背景动画）
- 🛡️ 更稳定的广告系统（错误自动降级）
- 📱 更好的性能表现

如有问题，查看 [README.md](./README.md) 或联系支持。
