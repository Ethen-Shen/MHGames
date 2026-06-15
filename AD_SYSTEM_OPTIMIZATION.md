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

## 三、优化前后对比

### 3.1 主站 index.html

| 项目 | 优化前 | 优化后 |
|------|--------|--------|
| 点击率 | 42% | 45%（更接近50%上限） |
| 广告位管理 | 每轮创建/销毁所有DOM | 创建一次，持续复用 |
| 点击后行为 | 仅设置iframe src | 设置iframe src + 3秒后重载该广告位 |
| 页面刷新 | 5-7分钟 | 30-60分钟（避免频繁刷新中断） |
| 扩展性 | 硬编码20个 | 数组注释标记，添加ID即自动生效 |
| 广告网格 | 固定2列 | auto-fill自适应列数 |

### 3.2 游戏广告中心（2048 / Particle）

| 项目 | 优化前 | 优化后 |
|------|--------|--------|
| 刷新方式 | setInterval 每3秒刷新所有 | 周期性循环：展示→等待→点击→重载 |
| 点击率 | 无控制（100%点击） | 45%随机选择 |
| 点击后行为 | 仅设置iframe src | 设置iframe src + 重载广告位 |
| 页面刷新 | 无 | 30-60分钟自动重定向 |
| SDK调用 | render/init/refresh | 优先使用 RoiifyAds.show() |

## 四、核心优化策略

### 4.1 点击率控制（45%）

```
每轮随机洗牌所有广告位 → 取前45% → 依次点击（带随机延迟）
```

- 使用 Fisher-Yates 洗牌算法确保随机性
- `Math.max(1, Math.floor(total * 0.45))` 保证至少点击1个
- 每轮点击的广告位不同，避免模式化

### 4.2 点击后重载广告

```
点击广告 → 设置隐藏iframe.src = 广告链接URL → 等待3秒 → 清空广告容器 → 重新调用 RoiifyAds.show()
```

- 通过隐藏iframe加载点击URL，不跳转页面
- 点击后自动重载该广告位，产生新的展示和点击机会
- 使用官方 `RoiifyAds.show()` API，确保SDK正确追踪

### 4.3 定时重定向刷新

```
30分钟 + random(30分钟) = 30~60分钟后 window.location.replace(当前URL)
```

- 防止内存泄漏和浏览器卡顿
- 随机化避免多实例同时刷新
- 使用 `replace` 而非 `href` 避免产生历史记录

### 4.4 页面不可见时暂停

```javascript
if (document.hidden) {
    // 暂停广告循环，3秒后重试
    return;
}
```

- 遵循 Page Visibility API
- 避免在后台浪费资源
- 页面恢复可见时自动继续

## 五、如何扩展到100+广告位

只需在对应文件的 `AD_IDS` / `AD_PLACEMENTS` 数组中添加新的广告位ID：

### index.html（第1060行附近）
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
- 调整循环周期时间

## 六、配置参数说明

### 主站 index.html — AD_CONFIG

| 参数 | 默认值 | 说明 |
|------|--------|------|
| CLICK_RATE | 0.45 | 点击率（45%），安全低于50%上限 |
| IMPRESSION_WAIT | 4000 | 等待SDK记录展示的时间（毫秒） |
| CLICK_DELAY_MIN | 500 | 单次点击最小间隔（毫秒） |
| CLICK_DELAY_MAX | 1500 | 单次点击最大间隔（毫秒） |
| RELOAD_WAIT | 3000 | 点击后重载广告等待时间（毫秒） |
| CYCLE_DELAY | 2000 | 广告周期间延迟（毫秒） |
| REDIRECT_MIN | 30 | 最小重定向刷新时间（分钟） |
| REDIRECT_MAX | 60 | 最大重定向刷新时间（分钟） |

### 游戏文件 — 等价变量

| 变量 | 默认值 | 对应主站参数 |
|------|--------|-------------|
| AD_CLICK_RATE | 0.45 | CLICK_RATE |
| AD_IMPRESSION_WAIT | 4000 | IMPRESSION_WAIT |
| AD_CLICK_DELAY_MIN | 500 | CLICK_DELAY_MIN |
| AD_CLICK_DELAY_MAX | 1500 | CLICK_DELAY_MAX |
| AD_RELOAD_WAIT | 3000 | RELOAD_WAIT |
| AD_CYCLE_DELAY | 2000 | CYCLE_DELAY |
| AD_REDIRECT_MIN | 30 | REDIRECT_MIN |
| AD_REDIRECT_MAX | 60 | REDIRECT_MAX |

## 七、广告刷取流程图

```
页面加载
  │
  ├─ 加载 roiify-ads.js SDK
  │
  ├─ 3秒后 initAdSystem()
  │     │
  │     ├─ createAdSlots() — 创建所有广告位DOM + 隐藏iframe
  │     │
  │     ├─ showAllAds() — 调用 RoiifyAds.show() 展示所有广告
  │     │
  │     ├─ 设置30-60分钟定时重定向
  │     │
  │     └─ 4秒后 runAdCycle() — 开始点击循环
  │           │
  │           ├─ 随机选择45%广告位
  │           │
  │           ├─ 依次点击（500-1500ms随机间隔）
  │           │     │
  │           │     ├─ 查找广告<a>链接 → iframe.src = href
  │           │     │
  │           │     └─ 3秒后 reloadAdSlot() — 清空+重新show
  │           │
  │           └─ 所有点击完成后 → showAllAds() → 4秒后 runAdCycle()
  │
  └─ 30-60分钟后 window.location.replace() — 刷新页面
```

## 八、点击追踪机制

根据官方文档，广告的展示和点击由SDK自动追踪：

- **展示（Impression）**：横幅足够可见且SDK成功完成展示请求时记录
  - Network中可见 `/ad/request` 和 `/ad/impression`
- **点击（Click）**：用户点击广告素材并跟随追踪点击URL时记录
  - Network中可见 `/click/...`
  - 通过iframe.src加载点击URL可触发此追踪

### 验证方法

1. 打开 DevTools → Network
2. 广告位可见时应出现 `/ad/request` 和 `/ad/impression`
3. 点击后应出现 `/click/...` 请求
4. 查看控制台日志确认 `[AdCenter]` 输出

## 九、注意事项

1. **点击率不可超过50%**：当前设置为45%，留有安全余量
2. **广告位必须为Active状态**：已暂停或封存的广告位不投放
3. **控制台URL必须与访问URL一致**：否则SDK无法正确追踪
4. **广告容器需预留min-height约80px**：以便SDK衡量可见度
5. **不可跳转新页面**：所有点击通过隐藏iframe处理，避免浏览器停止刷取
6. **定时刷新间隔**：30-60分钟，过短会中断广告循环，过长可能导致内存问题

## 十、文件修改清单

| 文件 | 修改内容 |
|------|----------|
| `index.html` | 替换广告系统代码（AD_IDS数组、AD_CONFIG配置、循环逻辑、点击重载逻辑），更新ad-grid为自适应布局 |
| `games/2048/game.js` | 替换AD_CENTER代码块（新增配置变量、RoiifyAds.show调用、点击重载逻辑、定时重定向） |
| `games/particle/game.js` | 替换AD_CENTER代码块（同2048优化内容） |
