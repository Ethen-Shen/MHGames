# 📤 上传项目到GitHub指南

## 仓库信息
**仓库地址**: `https://github.com/Ethen-Shen/MHGames.git`

## 📋 步骤1：安装Git

1. 访问: https://git-scm.com/download/win
2. 下载并安装Git for Windows
3. 安装完成后，打开 **Git Bash** 终端

## ⚙️ 步骤2：配置Git

打开Git Bash，运行以下命令：

```bash
# 设置用户名
git config --global user.name "你的GitHub用户名"

# 设置邮箱（GitHub注册邮箱）
git config --global user.email "你的邮箱@example.com"

# 验证配置
git config --list
```

## 🚀 步骤3：上传项目

打开Git Bash，依次运行以下命令：

```bash
# 1. 进入项目目录
cd d:/TelegramGames/TelegramGames

# 2. 初始化Git仓库
git init

# 3. 添加远程仓库
git remote add origin https://github.com/Ethen-Shen/MHGames.git

# 4. 添加所有文件到暂存区
git add .

# 5. 查看状态（可选）
git status

# 6. 提交代码
git commit -m "Initial commit: 游戏网站基础结构"

# 7. 推送到GitHub
git push -u origin main
```

## 🔑 可能遇到的问题

### 问题1：需要登录验证
如果提示需要登录，使用以下方式之一：

**方式A：使用Token（推荐）**
1. 登录GitHub → Settings → Developer settings → Personal access tokens
2. 生成新token（勾选repo权限）
3. 推送时用户名填GitHub用户名，密码填token

**方式B：使用SSH（推荐长期使用）**
```bash
# 生成SSH密钥
ssh-keygen -t ed25519 -C "你的邮箱@example.com"

# 复制公钥到GitHub
cat ~/.ssh/id_ed25519.pub

# 添加到GitHub: Settings → SSH and GPG keys
```

### 问题2：分支名问题
如果提示`main`分支不存在：
```bash
# 查看分支
git branch

# 创建并切换到main分支
git checkout -b main

# 重新推送
git push -u origin main
```

## ✅ 验证上传成功

1. 访问: https://github.com/Ethen-Shen/MHGames
2. 确认文件已上传

## 📦 文件结构说明

上传的文件：
```
TelegramGames/
├── .gitignore          # Git忽略配置
├── DIRECTORY_STRUCTURE.md  # 目录结构设计文档
└── index.html          # 游戏网站主页
```

## 🔄 更新代码（后续维护）

```bash
# 添加修改的文件
git add .

# 提交更改
git commit -m "更新说明"

# 推送到GitHub
git push
```

## 🎯 下一步

上传成功后，可以：
1. 在Vercel中导入此仓库
2. 配置自定义域名
3. 设置CDN存储媒体文件

如有问题，可以直接访问仓库查看或联系我！