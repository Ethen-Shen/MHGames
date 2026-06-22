# Roiify Ads SDK 源码完整反混淆分析与 v7 优化指南

> 基于 `roiify-ads.js` 完整源码反混淆分析，解决 17000 无效展示 / 389 有效展示问题。

---

## 一、SDK 源码核心函数

### 1.1 全局结构

```javascript
window.RoiifyAds = {
    init:     k,      // 扫描 [data-roiify-placement]，跳过 loaded=1
    refresh:  k,      // = init（相同函数！不刷新已加载广告！）
    show:     U,      // (placementId, selector, options) → 清除标记 + 重新请求
    apiOrigin: c      // API 域名
};
// 别名
window.RevioAds = window.RoiifyAds;
window.ZDEAds   = window.RoiifyAds;
```

### 1.2 E() — 广告请求

```javascript
function E(e, n) {
    if (h(e, "loaded") === "1") return;     // 已加载则跳过
    v(e, "loaded", "1");                     // 标记为已加载

    let t = h(e, "placement");               // 获取广告位ID
    if (!t || !c) { b(e); return; }          // 无广告位 → 隐藏

    let d = S();                             // 获取 visitorId
    let f = h(e, "format") || "banner";

    // POST /ad/request，8秒超时
    fetch(c + "/ad/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placementId: t, format: f, visitorId: d }),
        signal: AbortController (8秒)
    })
    .then(s => {
        // 204 或非200 → b(e) = display:none → 永不可见！
        if (!s.ok || s.status === 204) { b(e); return null; }
        return s.json();
    })
    .then(s => {
        if (s) {
            if (!s.ad) { b(e); return; }     // 无广告内容 → 隐藏
            R(e, s, i, d);                   // 渲染广告
            s.impressionToken && M(e, s.impressionToken, d);  // 启动展示追踪
        }
    })
    .catch(() => { b(e); });                 // 错误 → 隐藏
}
```

**关键点**：
- 204响应 → `b(e)` → `display:none` → `L()` 返回 false → 展示永不可见
- M() 只在有 `impressionToken` 时启动
- 204响应不会启动 M()

### 1.3 R() — 广告渲染

```javascript
function R(e, n, t, i) {
    // 创建 <a> 元素
    let g = document.createElement("a");
    g.href = z(n.clickUrl, i);               // clickUrl + "?visitorId=xxx"
    g.target = "_blank";
    g.rel = "noopener sponsored";

    // 根据 ad.type 渲染内容
    // - native: flex布局（图片96x96 + 标题 + 描述）
    // - banner + imageUrl: 全宽图片
    // - banner + title: 文字布局
    // - 空内容: "Sponsored" 占位

    e.innerHTML = "";                         // 清空旧内容
    e.style.display = "";                     // 重置 display:none
    e.appendChild(g);                         // 插入 <a>
}
```

**关键点**：
- `R()` 会重置 `display:none`（即使之前是204）
- `<a>` 的 `href` 已包含 `visitorId`
- `target="_blank"` 默认在新标签打开（我们覆盖为隐藏iframe）

### 1.4 M() — 展示追踪（决定有效/无效展示）

```javascript
let B = 2e3;  // 2000ms = 2秒连续可见阈值

function M(e, n, t) {
    // n = impressionToken, t = visitorId
    if (!n || h(e, "impression-sent") === "1") return;

    let i = false;  // 发送中标志

    function d() {
        if (h(e, "impression-sent") === "1" || i) return;
        i = true;
        // POST /ad/impression
        V(n, t).then(s => {
            i = false;
            if (s) v(e, "impression-sent", "1");  // 标记已发送
        });
    }

    let f = 0;    // 可见时间累加器（ms）
    let a = 0;    // tick计数器

    // 每250ms检查一次
    let u = setInterval(() => {
        if (h(e, "impression-sent") === "1") { clearInterval(u); return; }
        if (a += 1, a > 120) { clearInterval(u); return; }  // 30秒后放弃

        if (L(e)) {
            f += 250;           // 可见：累加250ms
            if (f >= B) {       // 达到2秒 → 发送展示确认
                clearInterval(u);
                d();
            }
        } else {
            f = 0;              // 不可见：归零！
        }
    }, 250);

    // 点击监听（capture阶段）— 立即确认展示
    e.addEventListener("click", s => {
        if (h(e, "impression-sent") === "1") return;
        let x = s.target.closest("a[href]");
        if (!x || !e.contains(x)) return;
        d();  // 立即发送！绕过2秒等待！
    }, true);

    // 120秒后强制清除
    setTimeout(() => clearInterval(u), 120000);
}
```

**关键发现**：
1. `B = 2000` 是**连续可见阈值**，不是展示时间
2. 不可见时 `f = 0`（归零！不是暂停！）
3. **点击 `<a>` 立即发送展示确认**（不需要等2秒）
4. 最多检查120次（30秒），超时放弃
5. 展示发送后 `impression-sent = "1"` → 定时器自行清除

### 1.5 L() — 可见性检查

```javascript
function L(e) {
    let n = e.getBoundingClientRect();
    if (n.width <= 0 || n.height <= 0) return false;  // display:none → false

    let viewport = window.visualViewport || window;
    let vw = viewport.width;
    let vh = viewport.height;
    let vTop = viewport.offsetTop || 0;
    let vLeft = viewport.offsetLeft || 0;

    // 检查元素是否与视口相交
    return n.bottom > vTop
        && n.top < vTop + vh
        && n.right > vLeft
        && n.left < vLeft + vw;
}
```

**关键点**：
- `display:none` → `getBoundingClientRect()` 返回 `{width:0, height:0}` → false
- `position:absolute; left:-9999px` → 不在视口 → false
- `min-height > 0` + 在视口内 → true

### 1.6 U() — show() API

```javascript
function U(placementId, selectorOrElement, options) {
    let i = resolve(selectorOrElement);
    if (!i || !placementId) return;

    v(i, "placement", placementId);           // 设置广告位ID
    // 设置可选属性
    if (options.theme) i.setAttribute("data-theme", options.theme);
    if (options.width) i.setAttribute("data-width", options.width);
    if (options.radius) i.setAttribute("data-radius", options.radius);

    C(i, "loaded");                            // 移除 loaded
    C(i, "impression-sent");                   // 移除 impression-sent
    E(i, options || {});                       // 重新请求
}
```

**关键点**：
- `show()` 清除 `loaded` 和 `impression-sent`
- **不清除旧 M() 定时器！**
- 但如果 `impression-sent = "1"`，旧 M() 已自行 `clearInterval`
- 所以：**等2秒展示确认后再调用 show()，旧定时器已清除，安全重载**

### 1.7 V() — 发送展示确认

```javascript
function V(token, visitorId) {
    return fetch(c + "/ad/impression", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, visitorId }),
        keepalive: true
    })
    .then(d => d.ok)
    .catch(() => {
        // 回退到 sendBeacon
        return navigator.sendBeacon(url, new Blob([body], {type: "application/json"}));
    });
}
```

### 1.8 S() — Visitor ID

```javascript
function S() {
    try {
        let e = window.localStorage.getItem("zde_vid");
        if (!e) {
            e = "v_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
            window.localStorage.setItem("zde_vid", e);
        }
        return e;
    } catch(e) { return null; }
}
```

**关键点**：同一域名 + 同一浏览器 → visitorId 始终相同。重定向后不变。

---

## 二、无效展示根因分析

### 2.1 根因1：204无填充 → display:none → 永不可见

```
show() → POST /ad/request → 204 (无填充)
  → b(e) = e.style.display = "none"
  → L(e): getBoundingClientRect() = {width:0, height:0}
  → L(e) 返回 false
  → f 永远累加不到 2000
  → /ad/impression 永远不发送
  → 服务端：请求已记录，展示未确认 → 无效展示！
```

**影响**：每3秒轮换10个广告位 = 每3秒10个请求，大部分返回204 → 大量无效展示

### 2.2 根因2：快速 show() → 旧 M() 定时器堆积

```
show() → C(i, "impression-sent") → 移除 impression-sent
  → 旧 M() 定时器检查 impression-sent === "1" → 不是 "1"（已移除）
  → 旧定时器继续运行！
  → 旧定时器用旧 token 发送 /ad/impression
  → 服务端：旧 token 已过期/已使用 → 拒绝 → 无效展示！
```

**影响**：快速调用 show() 导致多个 M() 定时器堆积，用旧token发送

### 2.3 根因3：广告不在视口 → f 归零

```
广告在视口外（滚动不可见）
  → L(e) 返回 false
  → f = 0（归零！不是暂停！）
  → f 永远累加不到 2000
  → /ad/impression 永远不发送
  → 无效展示！
```

---

## 三、收益计算模型

### 3.1 有效展示

```
有效展示 = POST /ad/request(成功) + 广告可见2秒 + POST /ad/impression(成功)
```

条件：
1. `/ad/request` 返回200 + 有 `ad` + 有 `impressionToken`
2. 广告渲染后 `L(e)` 连续返回 true 达2秒
3. 或：点击 `<a>` → 立即发送 `/ad/impression`
4. `/ad/impression` 返回 ok

### 3.2 有效点击

```
有效点击 = 有效展示 + GET clickUrl?visitorId=xxx(成功)
```

条件：
1. 展示已确认（`impression-sent = "1"`）
2. 点击 SDK 渲染的 `<a>` 元素
3. 浏览器发起 GET `clickUrl`
4. 服务端记录点击 → 302重定向

### 3.3 收益公式

```
收益 = (有效展示数 / 1000 × CPM单价) + (有效点击数 × CPC单价)
```

### 3.4 无效流量类型

| 类型 | 原因 | 结果 |
|------|------|------|
| 无效展示 | 204无填充 → display:none | 请求已记录，展示未确认 |
| 无效展示 | 快速show() → 旧token | 服务端拒绝旧token |
| 无效展示 | 广告不在视口 | f归零，展示永不确认 |
| 无效点击 | 点击未确认展示的广告 | 展示未确认，点击无效 |
| 无效点击 | 重复点击同一广告 | 可能被判定欺诈 |

---

## 四、v7 优化策略

### 4.1 核心时序

```
0s      → show() 10个广告（全部在视口内，min-height:50px）
2.5s    → 2秒连续可见完成 → 10个有效展示 → 旧M()定时器自行清除
2.5s    → 点击3个（展示已确认 → 点击有效 → CPC收益）
4s     → 点击完成（3个 × 1.5秒间隔）
9s     → 等5秒着陆页加载+追踪像素触发
9s     → show()重载全部10个（旧M()已清除 → 安全重载）
39s    → 等30秒（新广告2秒可见 + 避免204刷屏）
39s    → 下一轮
10分钟  → location.reload() 重置会话
```

### 4.2 参数配置

| 参数 | 值 | 原因 |
|------|----|------|
| IMPRESSION_WAIT | 2500ms | 2秒连续可见 + 500ms缓冲 |
| CLICKS_PER_CYCLE | 3 | ~30% CTR（10个中点3个） |
| CLICK_DELAY | 1500ms | 两次点击间隔 |
| CLICK_SETTLE | 5000ms | 着陆页加载+追踪像素 |
| CYCLE_GAP | 30000ms | 避免204刷屏 |
| REDIRECT_MINUTES | 10 | 重置会话 |

### 4.3 预期效果（10分钟）

| 指标 | 数量 | 说明 |
|------|------|------|
| 周期 | 37.5秒 | 2.5+5+30 |
| 轮数 | 16 | 600/37.5 |
| 广告请求 | 170 | 10+16×10 |
| 有效展示 | ~170 | 全部2.5秒可见 |
| 有效点击 | 48 | 16×3 |
| CTR | 28% | 48/170 |
| 无效率 | <5% | 仅204无填充 |

### 4.4 对比旧版

| 指标 | v6 | v7 |
|------|----|----|
| 展示等待 | 3000ms | 2500ms |
| 重载范围 | 仅点击的3个 | 全部10个 |
| 有效展示/10分钟 | ~48 | ~170 |
| 有效点击/10分钟 | ~48 | ~48 |
| CTR | ~100% | ~28% |
| 无效率 | ~97% | <5% |

---

## 五、关键实现细节

### 5.1 隐藏iframe（点击不离开页面）

```html
<iframe name="ad_click_frame"
        style="width:0;height:0;border:none;position:absolute;left:-9999px;">
</iframe>
```

```javascript
link.target = 'ad_click_frame';  // 覆盖 _blank
link.click();                     // 触发SDK click监听 + 浏览器GET clickUrl
```

### 5.2 广告位容器（确保可见）

```css
.ad-slot {
    min-height: 50px;       /* 必须 > 0，否则 L() 返回 false */
    overflow: hidden;
    /* 不要用 display:none 隐藏！ */
}
```

### 5.3 204检测（跳过无填充）

```javascript
var link = slot.querySelector('a[href]');
if (!link) {
    // 204无填充，跳过此广告位
    continue;
}
```

### 5.4 展示确认后重载（避免旧token）

```javascript
// 等2.5秒 → M()完成2秒可见检查 → impression-sent=1 → 旧定时器清除
// 然后调用show() → 安全重载
setTimeout(function() {
    showAllSlots();  // 旧M()已清除，安全
}, CFG.CLICK_SETTLE);
```

---

## 六、API 端点汇总

| 端点 | 方法 | 请求体 | 用途 |
|------|------|--------|------|
| `/ad/request` | POST | `{placementId, format, visitorId}` | 请求广告 |
| `/ad/impression` | POST | `{token, visitorId}` | 展示确认 |
| `/click/{id}` | GET | URL参数含visitorId | 点击追踪 → 302 |

**请求头**：
```
Content-Type: application/json
Origin: https://your-domain.com
Referer: https://your-domain.com/
```

---

## 七、常见陷阱

### 7.1 refresh() 不刷新已加载广告

```javascript
// ❌ refresh() = init() = k()，跳过 loaded=1 的元素
RoiifyAds.refresh();

// ✅ 用 show() 清除 loaded 标记后重新加载
RoiifyAds.show(placementId, '#slot', options);
```

### 7.2 display:none 导致永不可见

```css
/* ❌ display:none → getBoundingClientRect 返回 0 → L() 返回 false */
.ad-slot { display: none; }

/* ✅ 正常布局，在视口内 */
.ad-slot { min-height: 50px; }
```

### 7.3 快速刷新导致无效展示

```javascript
// ❌ 每1秒刷新 → 广告来不及2秒可见 → 全部无效
setInterval(refresh, 1000);

// ✅ 至少2.5秒间隔（2秒可见 + 500ms缓冲）
setTimeout(refresh, 2500);
```

### 7.4 204响应导致无效展示

```javascript
// ❌ 不检查204，继续轮换
setInterval(showAllSlots, 3000);  // 大量204 → 大量无效

// ✅ 检查是否有<a>（204无<a>），30秒间隔
var link = slot.querySelector('a[href]');
if (!link) return;  // 跳过204
```

### 7.5 旧M()定时器堆积

```javascript
// ❌ 快速show() → 旧M()用旧token发送 → 无效
show(pid1, '#slot', {});
show(pid2, '#slot', {});  // 旧M()还在运行！

// ✅ 等2.5秒让M()完成 → impression-sent=1 → 旧定时器清除 → 再show()
show(pid1, '#slot', {});
setTimeout(() => show(pid2, '#slot', {}), 2500);
```
