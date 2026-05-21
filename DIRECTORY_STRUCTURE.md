# 📁 Telegram Games 项目目录结构设计

## 一、推荐目录结构

```
TelegramGames/                    # Git仓库根目录
├── 📄 .gitignore                # Git忽略配置
├── 📄 package.json              # 项目依赖配置（如需要）
├── 📄 vercel.json               # Vercel部署配置
├── 📄 README.md                 # 项目说明文档
├── 📄 index.html                # 主页（游戏列表）
├── 📄 404.html                  # 404页面
├── 📄 privacy.html              # 隐私政策
├── 📄 terms.html                # 服务条款
├── 📁 assets/                   # 全局公共资源（所有游戏共享）
│   ├── 📁 images/               # 公共图片
│   │   ├── 📁 icons/           # 图标（Logo、按钮图标等）
│   │   ├── 📁 banners/         # 横幅广告图
│   │   ├── 📁 backgrounds/      # 背景图片
│   │   └── 📁 placeholder/      # 占位图片
│   ├── 📁 videos/               # 公共视频（宣传视频等）
│   ├── 📁 audio/                # 公共音频（背景音乐、音效）
│   └── 📁 fonts/                # 自定义字体
├── 📁 games/                    # 游戏目录（每个游戏一个子目录）
│   ├── 📁 2048/                 # Neon 2048 游戏
│   │   ├── 📄 index.html        # 游戏主页面
│   │   ├── 📄 game.js           # 游戏逻辑
│   │   ├── 📄 style.css         # 游戏样式
│   │   ├── 📄 game.json         # 游戏配置
│   │   └── 📁 assets/           # 该游戏专属资源
│   │       ├── 📁 images/       # 游戏图片素材
│   │       ├── 📁 audio/        # 游戏音效
│   │       └── 📁 data/         # 游戏数据（关卡、配置等）
│   ├── 📁 particle/             # 粒子消除游戏
│   │   ├── 📄 index.html
│   │   ├── 📄 game.js
│   │   ├── 📄 style.css
│   │   └── 📁 assets/
│   │       ├── 📁 images/
│   │       └── 📁 audio/
│   ├── 📁 snake/                # 贪吃蛇游戏
│   │   └── ...
│   └── 📁 tetris/               # 俄罗斯方块游戏
│       └── ...
├── 📁 js/                       # 全局JavaScript
│   ├── 📄 main.js               # 主入口脚本
│   ├── 📄 lang.js               # 多语言支持
│   └── 📄 theme.js              # 主题切换逻辑
└── 📁 css/                      # 全局样式
    ├── 📄 main.css              # 主样式文件
    └── 📄 responsive.css        # 响应式样式
```

## 二、目录职责说明

### 2.1 根目录文件
| 文件 | 说明 | 是否必需 |
|---|---|---|
| `.gitignore` | 配置Git忽略规则 | ✅ 必需 |
| `package.json` | Node.js项目配置（如有构建需求） | ⚠️ 视情况 |
| `vercel.json` | Vercel部署配置 | ✅ 推荐 |
| `index.html` | 游戏列表主页 | ✅ 必需 |
| `404.html` | 页面未找到 | ✅ 推荐 |
| `privacy.html` | 隐私政策（Telegram要求） | ✅ 必需 |
| `terms.html` | 服务条款（Telegram要求） | ✅ 必需 |

### 2.2 assets/ - 全局资源
用于存放**所有游戏共享**的资源：
- **images/icons/** - Logo、UI图标等
- **images/banners/** - 网站横幅广告
- **images/backgrounds/** - 页面背景图
- **videos/** - 宣传视频、开场动画
- **audio/** - 全局背景音乐
- **fonts/** - 自定义字体文件

### 2.3 games/ - 游戏目录
每个游戏独立一个子目录：
- **index.html** - 游戏入口页面
- **game.js** - 游戏核心逻辑
- **style.css** - 游戏样式
- **game.json** - 游戏配置（名称、描述、标签等）
- **assets/** - 该游戏专属资源（不与其他游戏共享）

## 三、静态资源存储方案对比

### 3.1 方案对比表

| 方案 | 优点 | 缺点 | 适合场景 |
|---|---|---|---|
| **存放在Git仓库** | 简单、版本控制、部署方便 | 仓库体积大、克隆慢、带宽受限 | 小图标、配置文件、小尺寸素材 |
| **CDN存储** | 加载快、节省带宽、支持大文件 | 需要额外配置、有成本 | 图片、视频、音频等大文件 |
| **混合方案** | 兼顾版本控制和加载性能 | 需要维护两套存储 | 推荐！最佳实践 |

### 3.2 推荐方案：混合存储

```
┌─────────────────────────────────────────────────────────────┐
│                    Git仓库 (代码+小资源)                     │
│  ├── 所有HTML/CSS/JS文件                                   │
│  ├── 小图标 (< 50KB)                                       │
│  ├── 配置文件 (JSON)                                       │
│  └── 游戏逻辑代码                                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    CDN (大资源)                             │
│  ├── 游戏素材图片 (PNG/JPG/WebP)                            │
│  ├── 视频文件 (MP4/WebM)                                   │
│  ├── 音频文件 (MP3/OGG)                                    │
│  └── 大尺寸背景图                                          │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 CDN选择建议

| CDN服务 | 特点 | 推荐度 |
|---|---|---|
| **Cloudflare R2** | 免费额度高、带宽便宜 | ⭐⭐⭐⭐⭐ |
| **AWS S3 + CloudFront** | 功能强大、全球加速 | ⭐⭐⭐⭐ |
| **Vercel Blob** | 与Vercel无缝集成 | ⭐⭐⭐⭐ |
| **Imgur/Unsplash** | 图片托管（免费有局限） | ⭐⭐⭐ |

## 四、Vercel部署配置

### 4.1 vercel.json 配置示例

```json
{
  "version": 2,
  "builds": [
    { "src": "index.html", "use": "@vercel/static" },
    { "src": "games/**/*.html", "use": "@vercel/static" },
    { "src": "assets/**/*", "use": "@vercel/static" }
  ],
  "routes": [
    { "src": "/", "dest": "/index.html" },
    { "src": "/games/(.*)", "dest": "/games/$1/index.html" },
    { "src": "/(.*)", "dest": "/404.html" }
  ],
  "domains": [
    { "domain": "yourdomain.com", "redirect": false }
  ]
}
```

### 4.2 环境变量配置

在Vercel控制台配置：
```
CDN_URL=https://your-cdn.com
```

### 4.3 代码中使用CDN

```javascript
// 获取CDN地址（开发环境使用本地，生产环境使用CDN）
const CDN_URL = process.env.CDN_URL || '/assets';

// 使用示例
const gameImage = `${CDN_URL}/images/games/2048/tile.png`;
```

## 五、域名配置

### 5.1 购买域名

推荐平台：
- **Namecheap** - 性价比高
- **Cloudflare Registrar** - 免费隐私保护
- **GoDaddy** - 老牌服务商

### 5.2 配置DNS

在域名管理后台添加记录：

| 记录类型 | 主机名 | 值 |
|---|---|---|
| A | @ | 76.76.21.21 (Vercel IP) |
| A | www | 76.76.21.21 |
| CNAME | * | cname.vercel-dns.com |

### 5.3 在Vercel添加域名

1. 打开Vercel项目设置
2. 进入Domains页面
3. 添加你的域名（如：yourdomain.com）
4. 按照提示配置DNS验证

## 六、最佳实践建议

### 6.1 文件命名规范

```
# 目录：小写+连字符
games/neon-2048/
assets/images/game-icons/

# 文件：小写+连字符
game-over-screen.png
background-music.mp3

# 避免空格和特殊字符
❌ Game Over Screen.png
✅ game-over-screen.png
```

### 6.2 图片优化

```
# 使用现代格式
优先使用 WebP (比JPG小30%)

# 多尺寸适配
hero-mobile.webp
hero-desktop.webp

# 压缩工具
- Squoosh (在线)
- Sharp (Node.js)
- ImageOptim (Mac)
```

### 6.3 视频优化

```
# 格式选择
- MP4 (H.264) - 兼容性好
- WebM (VP9) - 体积小

# 分辨率
- 1080p 用于桌面
- 720p 用于移动端

# 压缩工具
- FFmpeg
- HandBrake
```

### 6.4 Git最佳实践

```gitignore
# .gitignore 配置
# 忽略大文件
*.mp4
*.webm
*.mp3
*.ogg
*.zip
*.rar

# 忽略系统文件
.DS_Store
Thumbs.db
*.swp

# 忽略环境变量
.env
.env.local

# 忽略构建产物
dist/
build/
```

## 七、资源加载策略

### 7.1 懒加载

```html
<!-- HTML -->
<img 
  src="placeholder.jpg" 
  data-src="actual-image.webp" 
  class="lazy"
  loading="lazy"
>

<script>
// JavaScript 懒加载
document.addEventListener('DOMContentLoaded', () => {
  const lazyImages = document.querySelectorAll('img.lazy');
  
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.remove('lazy');
          observer.unobserve(img);
        }
      });
    });
    
    lazyImages.forEach(img => imageObserver.observe(img));
  }
});
</script>
```

### 7.2 预加载关键资源

```html
<link rel="preload" href="critical-image.webp" as="image">
<link rel="preload" href="background-music.mp3" as="audio">
<link rel="preload" href="game.js" as="script">
```

## 八、扩展建议

### 8.1 游戏元数据管理

创建 `games.json` 统一管理所有游戏信息：

```json
{
  "games": [
    {
      "id": "neon-2048",
      "name": "Neon 2048",
      "name_zh": "霓虹2048",
      "description": "Classic 2048 with neon style",
      "description_zh": "霓虹风格经典2048",
      "tags": ["puzzle", "strategy", "casual"],
      "tags_zh": ["益智", "策略", "休闲"],
      "thumbnail": "neon-2048-thumb.webp",
      "category": "puzzle",
      "difficulty": "easy"
    }
  ]
}
```

### 8.2 国际化支持

使用 `lang.js` 集中管理翻译：

```javascript
const translations = {
  'zh': {
    'title': '游戏中心',
    'play': '开始游戏'
  },
  'en': {
    'title': 'Game Center', 
    'play': 'Play Now'
  }
};
```

## 九、总结

### 资源存储决策树

```
资源类型?
    ├── 代码文件 (.html/.css/.js/.json) → Git仓库 ✅
    ├── 小图标 (< 50KB) → Git仓库 ✅
    ├── 大图片/视频/音频 → CDN ✅
    └── 配置文件 → Git仓库 ✅
```

### 关键要点

1. **Git仓库存放代码和小资源**（便于版本控制）
2. **CDN存放大媒体文件**（提升加载速度）
3. **使用Vercel Blob或Cloudflare R2**（性价比高）
4. **配置环境变量**（开发/生产分离）
5. **图片使用WebP格式**（节省带宽）
6. **实现懒加载**（优化首屏性能）

这样的架构既保持了代码的可维护性，又保证了资源的加载性能，非常适合长期发展！