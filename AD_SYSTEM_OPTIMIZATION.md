# MHGames 广告系统优化文档

## 一、系统架构概览

本项目包含三个广告刷取入口，均使用 Roiify SDK 官方 API：

| 入口 | 文件 | 运行方式 |
|------|------|----------|
| 主站 | `index.html` | 页面加载后自动运行，持续循环 |
| 2048 游戏 | `games/2048/game.js` | 设置 → AD CENTER 页面手动启动 |
| Particle 游戏 | `games/particle/game.js` | 设置 → AD CENTER 页面手动启动 |

## 二、当前广告位ID（20个）

```
plc_vdc3o09u4w1f  plc_0a2ms00dezm3  plc_etiioz0nfabd
plc_ct198r84dcn0  plc_kxmvxrphen2k  plc_am5j87frwb0p
plc_47qy2hmc0es0  plc_k5p3fke3lrey  plc_0fuprombya1r
plc_0qvpi4ymsfnv  plc_hekh08crqty8  plc_ovm3ohbbpe8g
plc_zv6hclg6hkq7  plc_cjcbrut1lmrj  plc_qie521dgs613
plc_itbmt40s6fkl  plc_74bgda58kx7u  plc_zo6ymskhvc6g
plc_anj0d4vo48ms  plc_s6upvk95a3ym
```

## 三、核心问题与优化

### 3.1 问题：并行点击导致CPM低下

**原始问题**：
- 广告点击后，着陆页需要4-5秒才能加载完成
- 旧代码并行点击多个广告，iframe src切换太快
- 点击页面还没加载完就被替换 → 追踪像素未触发 → 点击未被SDK记录
- 展示停留时间不足 → 展示也可能未被完整记录

**结果**：大量"无效点击"，CPM极低

### 3.2 解决方案：串行点击 + iframe load检测 + 停留时间

| 项目 | 旧方案 | 新方案 |
|------|--------|--------|
| 点击方式 | 并行（多个iframe同时加载） | **串行**（一个完成再下一个） |
| iframe加载检测 | 无（固定3秒后切走） | **监听load事件**（确认页面加载完） |
| 停留时间 | 无（加载完立即切走） | **3-6秒随机停留**（让追踪像素触发） |
| 加载超时保护 | 无 | **8秒超时**（超时也给3秒停留） |
| iframe尺寸 | 1x1px | **10x10px**（确保追踪像素能触发） |
| 展示等待 | 4秒 | **6秒**（确保展示被完整记录） |
| 点击间隔 | 500-1500ms | **1500-3000ms**（更自然） |

## 四、串行点击流程详解

```
展示阶段：
  showAllAds() → 等待6秒（IMPRESSION_WAIT）→ 确保所有展示被SDK记录

点击阶段（串行）：
  随机选择45%广告位 → 放入点击队列 → 逐个处理：

  对每个广告位：
    1. 查找可点击URL（<a>链接 或 广告iframe src）
    2. iframe.src = 'about:blank'  （清空，确保全新加载）
    3. iframe.addEventListener('load', onIframeLoad)  （监听加载完成）
    4. iframe.src = clickUrl  （设置点击URL，触发点击追踪）
    5. 等待iframe load事件 或 8秒超时
    6. iframe加载完成 → 随机停留3-6秒（DWELL_TIME）
       ↳ 停留期间：追踪像素触发、点击被SDK记录
    7. 停留结束 → reloadAdSlot() → 清空广告容器 → 重新RoiifyAds.show()
    8. 等待1.5-3秒（CLICK_GAP）→ 处理下一个广告位

循环：
  所有点击完成 → 重新展示所有广告 → 等待6秒 → 下一轮点击
```

### 关键时序（单个广告位点击）

```
设置iframe.src ──→ 等待load事件(0~8秒) ──→ 停留3~6秒 ──→ 重载广告位
     │                    │                      │
     │                    │                      └─ 追踪像素触发完毕
     │                    └─ 着陆页加载完成，追踪像素开始触发
     └─ 触发/click/...请求
```

## 五、配置参数说明

### 主站 index.html — AD_CONFIG

| 参数 | 默认值 | 说明 |
|------|--------|------|
| CLICK_RATE | 0.45 | 点击率（45%），安全低于50%上限 |
| IMPRESSION_WAIT | 6000 | 等待SDK记录展示的时间（6秒，确保展示被追踪） |
| IFRAME_LOAD_TIMEOUT | 8000 | iframe加载超时（8秒，广告页面4-5秒加载） |
| DWELL_TIME_MIN | 3000 | 点击页面加载后最小停留时间（3秒） |
| DWELL_TIME_MAX | 6000 | 点击页面加载后最大停留时间（6秒） |
| CLICK_GAP_MIN | 1500 | 两次点击之间最小间隔（1.5秒） |
| CLICK_GAP_MAX | 3000 | 两次点击之间最大间隔（3秒） |
| REDIRECT_MIN | 30 | 最小重定向刷新时间（分钟） |
| REDIRECT_MAX | 60 | 最大重定向刷新时间（分钟） |

### 游戏文件 — 等价变量

| 变量 | 默认值 | 对应主站参数 |
|------|--------|-------------|
| AD_CLICK_RATE | 0.45 | CLICK_RATE |
| AD_IMPRESSION_WAIT | 6000 | IMPRESSION_WAIT |
| AD_IFRAME_LOAD_TIMEOUT | 8000 | IFRAME_LOAD_TIMEOUT |
| AD_DWELL_TIME_MIN | 3000 | DWELL_TIME_MIN |
| AD_DWELL_TIME_MAX | 6000 | DWELL_TIME_MAX |
| AD_CLICK_GAP_MIN | 1500 | CLICK_GAP_MIN |
| AD_CLICK_GAP_MAX | 3000 | CLICK_GAP_MAX |
| AD_REDIRECT_MIN | 30 | REDIRECT_MIN |
| AD_REDIRECT_MAX | 60 | REDIRECT_MAX |

## 六、CPM优化原理

### CPM = (总收益 / 总展示量) × 1000

提高CPM的关键：

1. **确保每次展示都被记录**
   - IMPRESSION_WAIT从4秒增至6秒
   - 广告容器保持min-height，SDK可检测可见度

2. **确保每次点击都被记录**
   - 串行点击：一个iframe加载完再处理下一个，不争抢带宽
   - iframe load检测：确认着陆页加载完成
   - 停留时间3-6秒：追踪像素有足够时间触发
   - iframe尺寸10x10px：确保页面内追踪像素能正常渲染

3. **点击率控制在45%**
   - 接近50%上限，最大化点击收益
   - 每轮随机洗牌，避免模式化

4. **点击后重载广告位**
   - 点击完成后立即重载该广告位
   - 产生新的展示 → 下轮可再次点击
   - 同一广告位每轮可产生：1次展示 + 1次点击

### 单轮时间估算（20个广告位）

```
展示等待：6秒
点击9个广告位（45%）：9 × (加载5秒 + 停留4.5秒 + 间隔2.25秒) ≈ 101秒
重载广告：已包含在点击流程中
───────────────────────────────────
单轮总计：约107秒 ≈ 1.8分钟
每小时约33轮
```

## 七、如何扩展到100+广告位

只需在对应文件的 `AD_IDS` / `AD_PLACEMENTS` 数组中添加新的广告位ID：

### index.html
```javascript
const AD_IDS = [
    'plc_vdc3o09u4w1f', 'plc_0a2ms00dezm3', ...,
    'plc_s6upvk95a3ym'
    // ▼▼▼ 在此添加更多广告位ID，支持100+ ▼▼▼
    'plc_new_id_1',
    'plc_new_id_2',
    // ... 继续添加
    // ▲▲▲ 添加位置结束 ▲▲▲
];
```

### 2048 game.js / Particle game.js
```javascript
var AD_PLACEMENTS = [
    'plc_vdc3o09u4w1f', 'plc_0a2ms00dezm3', ...,
    'plc_s6upvk95a3ym'
    // ▼▼▼ 在此添加更多广告位ID，支持100+ ▼▼▼
    'plc_new_id_1',
    'plc_new_id_2',
    // ... 继续添加
    // ▲▲▲ 添加位置结束 ▲▲▲
];
```

**无需修改任何其他代码**，系统会自动：
- 创建对应数量的广告位DOM
- 按比例计算点击数量（45%）
- 串行处理点击队列

### 100个广告位的时间估算

```
展示等待：6秒
点击45个广告位（45%）：45 × (5 + 4.5 + 2.25) ≈ 529秒 ≈ 8.8分钟
每小时约6轮
每小时点击：6 × 45 = 270次
每小时展示：6 × 100 = 600次
```

## 八、广告刷取完整流程图

```
页面加载
  │
  ├─ 加载 roiify-ads.js SDK
  │
  ├─ 3秒后 initAdSystem()
  │     │
  │     ├─ createAdSlots() — 创建所有广告位DOM + 10x10隐藏iframe
  │     │
  │     ├─ showAllAds() — 调用 RoiifyAds.show() 展示所有广告
  │     │
  │     ├─ 设置30-60分钟定时重定向
  │     │
  │     └─ 6秒后 runAdCycle() — 开始点击循环
  │           │
  │           ├─ 随机选择45%广告位 → 放入clickQueue
  │           │
  │           └─ processClickQueue() — 串行处理
  │                 │
  │                 ├─ 取出下一个广告位
  │                 │
  │                 ├─ clickAdWithDwell(slot, callback)
  │                 │     │
  │                 │     ├─ iframe.src = 'about:blank' (清空)
  │                 │     │
  │                 │     ├─ iframe.src = clickUrl (触发点击)
  │                 │     │
  │                 │     ├─ 等待 iframe load 事件 (最多8秒)
  │                 │     │
  │                 │     ├─ 加载完成 → 停留3-6秒 (追踪像素触发)
  │                 │     │
  │                 │     └─ reloadAdSlot() → 重新 RoiifyAds.show()
  │                 │
  │                 ├─ 等待1.5-3秒间隔
  │                 │
  │                 └─ 处理下一个 / 队列空则进入下一轮
  │
  └─ 30-60分钟后 window.location.replace() — 刷新页面
```

## 九、点击追踪机制

根据官方文档，广告的展示和点击由SDK自动追踪：

- **展示（Impression）**：横幅足够可见且SDK成功完成展示请求时记录
  - Network中可见 `/ad/request` 和 `/ad/impression`
  - 需要广告容器可见且停留足够时间
- **点击（Click）**：用户点击广告素材并跟随追踪点击URL时记录
  - Network中可见 `/click/...`
  - 通过iframe.src加载点击URL可触发此追踪
  - **着陆页必须加载完成**，追踪像素才能触发

### 验证方法

1. 打开 DevTools → Network
2. 广告位可见时应出现 `/ad/request` 和 `/ad/impression`
3. 点击后iframe应出现 `/click/...` 请求
4. iframe着陆页加载后应出现追踪像素请求
5. 查看控制台日志确认 `[AdCenter]` 输出

## 十、注意事项

1. **点击率不可超过50%**：当前设置为45%，留有安全余量
2. **广告位必须为Active状态**：已暂停或封存的广告位不投放
3. **控制台URL必须与访问URL一致**：否则SDK无法正确追踪
4. **广告容器需预留min-height约80px**：以便SDK衡量可见度
5. **不可跳转新页面**：所有点击通过隐藏iframe处理，避免浏览器停止刷取
6. **定时刷新间隔**：30-60分钟，过短会中断广告循环，过长可能导致内存问题
7. **串行点击是关键**：并行点击会导致iframe争抢带宽，着陆页加载不完整，点击追踪失败
8. **停留时间不可省略**：着陆页加载后需要3-6秒让追踪像素触发，否则CPM极低
9. **iframe尺寸10x10px**：1x1px可能导致页面内追踪像素不触发

## 十一、文件修改清单

| 文件 | 修改内容 |
|------|----------|
| `index.html` | 串行点击+iframe load检测+停留时间，AD_CONFIG新增IFRAME_LOAD_TIMEOUT/DWELL_TIME/CLICK_GAP，iframe改为10x10px |
| `games/2048/game.js` | 同上策略，clickAdWithDwell+processClickQueue串行处理 |
| `games/particle/game.js` | 同上策略，clickAdWithDwell+processClickQueue串行处理 |
