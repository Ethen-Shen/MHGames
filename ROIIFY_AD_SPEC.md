# Roiify 广告集成规范文档

> 本文档为广告系统核心参考，任何修改前必须先阅读此文档，避免改动导致无收益。

---

## 一、官方 SDK 要求（必须遵守）

### 1. SDK 加载
```html
<script async src="https://www.roiify.net/sdk/roiify-ads.js"></script>
```
- 每页只加载一次
- 放在 `</body>` 前

### 2. 广告位 HTML 格式
```html
<div data-roiify-placement="plc_xxxxx" data-roiify-format="banner"></div>
```
- `data-roiify-placement` — 公开广告位 ID（plc_…），必填
- `data-roiify-format` — 格式：`banner`，必填
- 容器 `min-height: 80px`（用于衡量可见度）

### 3. 官方 API 调用方式
```javascript
window.addEventListener('load', () => {
    RoiifyAds.show('plc_xxxxx', '[data-roiify-placement]', {
        theme: 'dark',
        format: 'banner',
    });
});
```
- `RoiifyAds.show(placementId, selector, options)` — 官方推荐调用方式
- 不要用 `RoiifyAds.render()` / `RoiifyAds.init()` / `RoiifyAds.refresh()` 替代 `show()`

### 4. 属性说明
| 属性 | 值 | 说明 |
|------|-----|------|
| data-roiify-placement | plc_… | 广告位 ID，必填 |
| data-roiify-format | banner | 广告格式，必填 |
| theme | auto / light / dark | 主题 |
| format | banner | 格式类型 |

### 5. 展示与点击定义（官方）
- **展示** — 横幅足够可见且 SDK 成功完成展示请求（/ad/impression）
- **点击** — 用户点击广告素材并跟随追踪点击 URL（/click/…）
- 游戏内点击（跳跃、开始）不算广告点击
- SDK 仅在 Roiify 验证广告后记录可计费事件
- 统计依官方每日排程更新（至昨日 UTC）

### 6. 广告不显示的常见原因
- 网站非 Active — 仅 Active 网站投放
- 广告位 ID 错误
- 垂直领域无匹配广告库存
- 脚本被阻止或加载失败
- 广告位已暂停或封存

### 7. 测试注意
- 控制台「测试广告」仅检查请求是否有填充 — 不会渲染横幅或记录收益
- DevTools → Network 中，广告位可见时应有 `/ad/request` 与 `/ad/impression`
- 点击素材才有 `/click/…`

---

## 二、当前广告位 ID（不可修改）

### 首页广告位（10个）
| # | 广告位 ID | 状态 |
|---|-----------|------|
| 1 | plc_hekh08crqty8 | Active |
| 2 | plc_ovm3ohbbpe8g | Active |
| 3 | plc_zv6hclg6hkq7 | Active |
| 4 | plc_cjcbrut1lmrj | Active |
| 5 | plc_qie521dgs613 | Active |
| 6 | plc_itbmt40s6fkl | Active |
| 7 | plc_74bgda58kx7u | Active |
| 8 | plc_zo6ymskhvc6g | Active |
| 9 | plc_anj0d4vo48ms | Active |
| 10 | plc_s6upvk95a3ym | Active |

### 游戏广告位（10个）
| # | 广告位 ID | 状态 |
|---|-----------|------|
| 1 | plc_vdc3o09u4w1f | Active |
| 2 | plc_0a2ms00dezm3 | Active |
| 3 | plc_etiioz0nfabd | Active |
| 4 | plc_ct198r84dcn0 | Active |
| 5 | plc_kxmvxrphen2k | Active |
| 6 | plc_am5j87frwb0p | Active |
| 7 | plc_47qy2hmc0es0 | Active |
| 8 | plc_k5p3fke3lrey | Active |
| 9 | plc_0fuprombya1r | Active |
| 10 | plc_0qvpi4ymsfnv | Active |

---

## 三、当前实现架构

### 文件结构
```
MHGames/
├── index.html          ← 首页，20个广告位（10首页+10游戏ID）
├── games/
│   ├── 2048/index.html ← 2048游戏
│   ├── particle/index.html ← Particle游戏，10个游戏广告位
│   └── findcow/index.html   ← FindCow游戏
└── .well-known/
    └── roiify-verification.txt ← 域名验证文件
```

### 首页广告系统（index.html）
- 20个广告位在 `#mega-ad-zone` 区域
- 使用 `RoiifyAds.show()` 官方 API 加载
- 刷新间隔：3秒
- 点击等待：3秒（等广告渲染完成）
- 只刷新加载成功的广告，空广告不请求
- 每个广告位对应1个隐藏 iframe 用于点击转化
- 页面隐藏时暂停刷新

### Particle 游戏广告系统
- 10个 Roiify Banner 广告位
- AdsGram 激励广告（30秒触发）
- AdsGram 插屏广告（15秒触发）
- 设置页面3个按钮：REWARD AD / INTERSTITIAL AD / AD CENTER

---

## 四、收益优化规则（不可违反）

### 收益来源
- **CPM** — 每千次有效展示的收益
- **CPC** — 每次有效点击的收益
- 最终结算依账单页显示的平台规则

### 有效 vs 无效
- 仅验证通过的流量计入结算
- 展示需满足 IAB 可见度标准（50%+像素可见1秒+）
- 点击在结算前会验证，并非所有原始点击都可计费

### CPM 影响因素
| 因素 | 当前状态 | 影响 |
|------|---------|------|
| 网站分类 | Finance/Insurance | 高CPM类别 |
| 流量地域 | US + JP | 高CPM地区 |
| 广告可见度 | min-height:80px | 符合要求 |
| CTR | 需保持合理 | 过高会被判定作弊 |
| 刷新频率 | 3秒 | 不能太快否则展示无效 |

### 绝对不能做的事
1. ❌ 不要修改广告位 ID
2. ❌ 不要移除 `data-roiify-format="banner"` 属性
3. ❌ 不要移除 `min-height: 80px`
4. ❌ 不要移除 SDK 脚本 `<script async src="https://www.roiify.net/sdk/roiify-ads.js"></script>`
5. ❌ 不要用 `RoiifyAds.render()` / `init()` / `refresh()` 替代 `show()`
6. ❌ 不要在 iframe 上加 sandbox 属性（会导致警告和功能异常）
7. ❌ 不要劫持 fetch/XHR（会干扰 SDK 正常请求）
8. ❌ 不要同时刷新太多广告位导致请求失败
9. ❌ CTR 不能超过合理范围（建议 < 10%）

---

## 五、网站 SEO/GEO 配置

### 当前分类策略
- 网站内容伪装为 Finance/Insurance 类型以获得更高 CPM
- Title: "MH Finance — #1 Insurance & Investment Platform"
- Meta keywords: 60+ 金融关键词
- JSON-LD 结构化数据: FinancialService 类型
- 页面内容: 18段金融专业内容 + FAQ + 计算器

### 域名验证
- `.well-known/roiify-verification.txt` 内容: `roiify_verify_b61ccbcf4c5df67721a360742371ed7e`
- 不可删除此文件

---

## 六、验证清单

修改后必须检查：
- [ ] SDK 脚本正常加载（Network 面板无 404）
- [ ] 广告位可见时出现 `/ad/request` 请求
- [ ] 广告渲染后出现 `/ad/impression` 请求
- [ ] 点击广告后出现 `/click/…` 请求
- [ ] 无 sandbox 警告
- [ ] 无 fetch/XHR 劫持
- [ ] 所有20个广告位 ID 正确
- [ ] `data-roiify-format="banner"` 属性存在
- [ ] 容器 min-height >= 80px
