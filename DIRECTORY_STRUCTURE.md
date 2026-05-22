# 📂 Telegram Games 项目目录结构说明

> ⏰ 最后更新: 2026-05-22
> 
> 🏷️ 版本: v2.0

---

## 📋 根目录文件

| 文件 | 说明 | 状态 |
|------|------|------|
| `README.md` | 项目总体说明文档 | ✅ 更新中 |
| `package.json` | Node.js 项目依赖和脚本配置 | ✅ |
| `vercel.json` | Vercel 部署配置文件 | ✅ |
| `bot-server.js` | Telegram Bot 服务端（本地运行） | ✅ |
| `index.html` | 首页 - 游戏选择页面 | ✅ |
| `404.html` | 404 错误页面 | ✅ |
| `privacy.html` | 隐私政策页面（Telegram 要求） | ✅ |
| `terms.html` | 服务条款页面（Telegram 要求） | ✅ |
| `DIRECTORY_STRUCTURE.md` | 本文件 - 目录结构说明 | ✅ 更新中 |
| `VERCEL_DEPLOY.md` | Vercel 部署和 Webhook 指南 | ✅ |
| `BOT_SETUP.md` | Telegram Bot 设置指南 | ✅ |

---

## 📁 一级目录说明

### 1. `/css` - 样式文件目录

存放全站共享的 CSS 样式文件。

| 文件 | 说明 |
|------|------|
| `style.css` | 主样式文件 |
| `responsive.css` | 响应式样式配置 |
| `lang.css` | 多语言支持样式 |

### 2. `/js` - JavaScript 脚本目录

存放全站共享的 JavaScript 文件。

| 文件 | 说明 |
|------|------|
| `main.js` | 主入口脚本 - 页面初始化和通用功能 |
| `lang.js` | 多语言翻译配置 |
| `theme.js` | 主题切换功能（亮色/暗色） |

### 3. `/assets` - 公共资源目录

存放所有游戏共享的媒体资源。

```
/assets/
├── images/          # 图片资源
│   ├── icons/       # 图标文件
│   ├── banners/     # 横幅广告
│   └── backgrounds/ # 背景图片
├── audio/           # 音频文件
│   ├── sfx/         # 音效文件
│   └── bgm/         # 背景音乐
└── fonts/           # 自定义字体
```

### 4. `/games` - 游戏目录（核心）

每个游戏一个独立子目录，包含该游戏的所有文件。

```
/games/
├── 2048/            # 2048 霓虹版游戏
│   ├── index.html   # 游戏主页面
│   ├── game.js      # 游戏核心逻辑 ⭐
│   ├── style.css    # 游戏样式
│   ├── lang.js      # 游戏语言文件
│   └── assets/      # 该游戏专属资源
└── particle/        # 粒子消除游戏
    ├── index.html   # 游戏主页面
    ├── game.js      # 游戏核心逻辑 ⭐
    ├── style.css    # 游戏样式
    ├── lang.js      # 游戏语言文件
    └── assets/      # 该游戏专属资源
```

### 5. `/api` - API 接口目录

存放 Vercel Serverless Functions。

| 文件 | 说明 |
|------|------|
| `webhook.js` | Telegram Webhook 接收处理 |

### 6. `/scripts` - 工具脚本目录

| 文件 | 说明 |
|------|------|
| `set-webhook.js` | 快捷设置 Webhook 的脚本 |

---

## 🎮 游戏目录详细说明

### `/games/2048/` - 2048 霓虹版

| 文件 | 核心功能 |
|------|---------|
| `index.html` | 游戏页面结构，包含 AdsGram SDK 引入和初始化 |
| `game.js` | 游戏逻辑：<br> • 数字合并逻辑<br> • 游戏状态管理<br> • AdsGram 广告显示（激励/插屏）<br> • 历史记录和最高分<br> • 道具功能（撤销/提示） |
| `style.css` | 霓虹风格的游戏界面样式 |
| `lang.js` | 游戏界面的中英文翻译 |

**重要更新 (v2.0):**
- ✅ 移除了 `bg-canvas` 背景动画
- ✅ 优化了 AdsGram 初始化逻辑
- ✅ 添加了 Telegram 环境检测
- ✅ 广告失败时直接给予奖励

### `/games/particle/` - 粒子消除游戏

| 文件 | 核心功能 |
|------|---------|
| `index.html` | 游戏页面结构，包含 AdsGram SDK 引入和初始化 |
| `game.js` | 游戏逻辑：<br> • 粒子消除算法<br> • 游戏时间和生命管理<br> • AdsGram 广告显示（激励视频复活）<br> • 连击和分数系统 |
| `style.css` | 粒子游戏的界面样式 |
| `lang.js` | 游戏界面的中英文翻译 |

**重要更新 (v2.0):**
- ✅ 移除了 `bg-canvas` 背景动画
- ✅ 简化了粒子爆炸效果（移除 canvas 粒子渲染）
- ✅ 优化了 AdsGram 初始化逻辑
- ✅ 添加了 Telegram 环境检测

---

## 🔌 AdsGram 广告集成说明

### 广告初始化位置

每个游戏的 `index.html` 中都包含：
1. AdsGram SDK 引入：`<script src="https://sad.adsgram.ai/js/sad.min.js"></script>`
2. 广告初始化代码，检测是否在 Telegram 环境中

### 广告显示逻辑

在 `game.js` 中：
- `showAd()` - 显示激励视频广告
- `showInterstitialAd()` - 显示插屏广告
- 新增安全检测：非 Telegram 环境自动跳过广告，直接给予奖励

### 广告 Block ID 配置

| 游戏 | 激励广告 | 插屏广告 |
|------|---------|---------|
| 2048 | `31225` | `int-30882` |
| 粒子 | `30885` | `int-30886` |

---

## 📊 文件修改历史 (v2.0)

### 已修改的文件

1. **`games/2048/index.html`**
   - 移除 `bg-canvas` 元素
   - 优化 AdsGram 初始化，添加 Telegram 环境检测

2. **`games/2048/game.js`**
   - 移除背景动画相关函数
   - 优化广告显示逻辑，添加超时和降级处理

3. **`games/particle/index.html`**
   - 移除 `bg-canvas` 元素
   - 优化 AdsGram 初始化

4. **`games/particle/game.js`**
   - 移除背景动画和粒子爆炸效果
   - 简化消除动画逻辑
   - 优化广告显示逻辑

5. **文档更新**
   - `README.md` - 更新项目说明和版本日志
   - `DIRECTORY_STRUCTURE.md` - 本文件，更新结构说明
   - `VERCEL_DEPLOY.md` - 待更新
   - `BOT_SETUP.md` - 待更新

---

## 🎯 快速查找指南

### 寻找广告相关代码
- 📍 `games/*/index.html` - 初始化
- 📍 `games/*/game.js` - 显示逻辑

### 寻找游戏核心逻辑
- 📍 `games/*/game.js` - 游戏主逻辑

### 寻找样式
- 📍 `css/style.css` - 全局样式
- 📍 `games/*/style.css` - 游戏专属样式

### 寻找多语言
- 📍 `js/lang.js` - 全局语言
- 📍 `games/*/lang.js` - 游戏语言

---

## 📝 备注

- 🚀 所有背景动画已移除以提升性能
- 🛡️ 广告模块已添加安全检测，非 Telegram 环境不会报错
- 📱 所有页面都是响应式设计，适配各种屏幕

---

**下一个文档更新**: [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md)
