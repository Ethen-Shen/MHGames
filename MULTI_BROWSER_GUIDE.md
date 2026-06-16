# 多开独立指纹浏览器刷广告 — 完整方案文档

## 一、核心问题：为什么需要代理IP？

广告平台（Roiify等）通过以下维度判断流量是否真实：

| 维度 | 同一IP（无代理） | 不同IP（有代理） |
|------|-----------------|-----------------|
| IP地址 | 20个浏览器同一IP | 20个浏览器20个不同IP |
| 地理位置 | 全部指向同一城市 | 分布在不同国家/城市 |
| IP信誉 | 单IP大量点击=异常 | 每个IP少量点击=正常 |
| 指纹关联 | 同IP+不同指纹仍可疑 | 不同IP+不同指纹=独立用户 |

**结论：没有代理IP，多开浏览器毫无意义，广告平台会直接识别并封禁。**

---

## 二、代理IP获取方式全景对比

### 2.1 四种获取方式

| 方式 | 成本 | 可用IP数量 | 质量 | 复杂度 | 推荐度 |
|------|------|-----------|------|--------|--------|
| **A. 购买住宅代理** | $0.65-7/GB | 几十万~上亿 | 高 | 低 | ★★★★★ |
| **B. VPN订阅转换** | 已有（0额外成本） | 86个节点 | 中 | 中 | ★★★☆☆ |
| **C. 自建VPS代理** | $3-10/月/VPS | 看你买几台 | 中高 | 高 | ★★☆☆☆ |
| **D. 免费代理** | 0 | 不稳定 | 极低 | 低 | ★☆☆☆☆ |

### 2.2 代理类型对比（关键！）

| 类型 | 来源 | 广告平台检测率 | 成功率 | 价格 |
|------|------|---------------|--------|------|
| 数据中心代理 | AWS/阿里云等 | **71-78%** | 22-29% | 便宜但没用 |
| 住宅代理 | 真实家庭网络 | **14-22%** | 78-86% | $1-15/GB |
| 移动代理(4G/5G) | 真实手机基站 | **4-9%** | 91-96% | $27+/月/设备 |

**数据中心代理（包括你的VPN节点）本质上都是机房IP，检测率极高。住宅代理才是正确选择。**

---

## 三、方案A：购买住宅代理（推荐）

### 3.1 推荐服务商

| 服务商 | 价格 | 特点 | 适合场景 |
|--------|------|------|----------|
| **IPRoyal** | $1.75-7/GB | 流量永不过期，Sticky最长7天 | 首选！中小规模 |
| **922 S5 Proxy** | $0.65-0.77/GB | IP池最大(200M+)，注册送600IP | 大规模，但IP质量下降 |
| **PIA S5 Proxy** | $0.05-0.07/IP | 按IP计费更灵活 | 按次计费场景 |
| **DataImpulse** | $1/GB | 性价比高 | 大规模 |

### 3.2 922 S5 Proxy 使用步骤（最常用）

```
步骤1：注册账号 → https://922proxy.com
步骤2：下载客户端（Windows/Mac）
步骤3：登录后，搜索目标国家（如 United States）
步骤4：选择IP → 右键"Port Forward"绑定到本地端口
        例如：127.0.0.1:6001 = 美国IP1
              127.0.0.1:6002 = 日本IP2
步骤5：在VirtualBrowser中配置代理为 127.0.0.1:对应端口
```

922生成的代理格式：
```
协议：SOCKS5
主机：127.0.0.1
端口：6001（你在客户端绑定的端口）
用户名：（空）
密码：（空）
```

### 3.3 IPRoyal 使用步骤

```
步骤1：注册 → https://iproyal.com
步骤2：购买住宅代理套餐（最便宜$7起，流量永不过期）
步骤3：在Dashboard获取代理凭证
        格式：username:password@gate.iproyal.com:12321
步骤4：选择Sticky会话（同一IP保持最长7天）
        用户名格式：username-country-us-session-abc123
        （abc123是会话ID，相同ID=相同IP，换ID=换IP）
步骤5：在VirtualBrowser中配置
```

IPRoyal代理格式：
```
协议：SOCKS5
主机：gate.iproyal.com
端口：12321
用户名：你的用户名-country-us-session-随机ID
密码：你的密码
```

### 3.4 VirtualBrowser 中配置代理

每个浏览器环境创建时设置代理：

```json
{
    "proxy": {
        "mode": 2,
        "protocol": "SOCKS5",
        "host": "127.0.0.1",
        "port": "6001",
        "user": "",
        "pass": "",
        "API": ""
    }
}
```

---

## 四、方案B：VPN订阅间接使用（你当前可用的免费方案）

### 4.1 核心原理

你的VPN订阅是 VLESS/Hysteria2 协议，VirtualBrowser 不认识这些协议。
但可以通过**本地代理客户端**将它们转换为 SOCKS5 代理：

```
VPN节点(VLESS/Hysteria2)
        ↓
本地代理客户端(v2rayN/Clash/Xray)
        ↓ 转换为
本地SOCKS5代理(127.0.0.1:端口)
        ↓
VirtualBrowser连接本地SOCKS5端口
```

### 4.2 你的VPN订阅节点清单

| 国家 | 节点数 | 协议 | 传输方式 |
|------|--------|------|----------|
| 日本 | 25 | VLESS(ws+tls) + VLESS(tcp+reality) + Hysteria2 | 多种 |
| 新加坡 | 18 | VLESS(ws+tls) + VLESS(tcp+reality) + Hysteria2 | 多种 |
| 美国 | 32 | VLESS(ws+tls) + VLESS(tcp+reality) + Hysteria2 | 多种 |
| 韩国 | 2 | Hysteria2 + VLESS(tcp+reality) | - |
| 台湾 | 3 | VLESS(tcp+reality) | - |
| 印度 | 2 | VLESS(ws+tls) | - |
| **合计** | **82+** | | |

剩余流量：97.54 TB（非常充足）

### 4.3 方法一：v2rayN 多端口映射（最简单）

**原理**：v2rayN 可以为每个节点分配不同的本地SOCKS5端口

**步骤**：

```
1. 下载安装 v2rayN
   → https://github.com/2dust/v2rayN/releases

2. 导入订阅
   → 订阅 → 订阅设置 → 添加你的订阅链接
   → 订阅 → 更新订阅（自动获取所有节点）

3. 开启多个v2rayN实例（每个实例一个节点）
   方法A：复制v2rayN文件夹到不同目录
   方法B：使用v2rayN的多配置功能

4. 每个实例配置不同的本地端口
   实例1：日本节点 → SOCKS5端口 10801
   实例2：新加坡节点 → SOCKS5端口 10802
   实例3：美国节点 → SOCKS5端口 10803
   ...

5. 在VirtualBrowser中配置
   环境1：代理 = 127.0.0.1:10801 (日本IP)
   环境2：代理 = 127.0.0.1:10802 (新加坡IP)
   环境3：代理 = 127.0.0.1:10803 (美国IP)
```

**限制**：v2rayN 每个实例只能激活一个节点，开20个环境需要20个v2rayN实例，资源消耗大。

### 4.4 方法二：Clash 多代理端口（推荐）

**原理**：Clash 支持同时运行所有节点，通过不同端口或规则选择出口节点

**步骤**：

```
1. 下载安装 Clash Verge Rev（推荐）
   → https://github.com/clash-verge-rev/clash-verge-rev/releases

2. 导入订阅
   → 配置 → 新建 → 类型选"Import" → 粘贴订阅链接
   → 点击更新

3. 关键：配置多端口模式
   编辑配置文件，为每个代理节点分配独立端口：

   port: 7890          # HTTP代理主端口
   socks-port: 7891    # SOCKS5主端口
   # 以下是需要手动添加的：
   listeners:
     - name: jp1
       type: socks
       port: 10801
       proxy: "日本东京01"
     - name: jp2
       type: socks
       port: 10802
       proxy: "日本东京02"
     - name: sg1
       type: socks
       port: 10803
       proxy: "新加坡01"
     - name: us1
       type: socks
       port: 10804
       proxy: "美国01"
     # ... 继续为每个节点分配端口

4. 启动Clash后，所有端口同时可用：
   127.0.0.1:10801 → 日本IP
   127.0.0.1:10802 → 日本IP
   127.0.0.1:10803 → 新加坡IP
   127.0.0.1:10804 → 美国IP
   ...

5. 在VirtualBrowser中配置
   环境1：SOCKS5 → 127.0.0.1:10801
   环境2：SOCKS5 → 127.0.0.1:10802
   环境3：SOCKS5 → 127.0.0.1:10803
   ...
```

### 4.5 方法三：Xray-core 多入站配置（最灵活）

**原理**：直接用 Xray-core 配置多个inbound，每个绑定不同节点和端口

**步骤**：

```
1. 下载 Xray-core
   → https://github.com/XTLS/Xray-core/releases

2. 创建配置文件 config.json（见下方模板）

3. 运行：xray.exe run -c config.json

4. 所有SOCKS5端口同时可用
```

**Xray 配置模板**（以3个节点为例）：

```json
{
    "log": { "loglevel": "warning" },
    "inbounds": [
        {
            "tag": "socks-jp1",
            "port": 10801,
            "listen": "127.0.0.1",
            "protocol": "socks",
            "settings": { "udp": true }
        },
        {
            "tag": "socks-sg1",
            "port": 10802,
            "listen": "127.0.0.1",
            "protocol": "socks",
            "settings": { "udp": true }
        },
        {
            "tag": "socks-us1",
            "port": 10803,
            "listen": "127.0.0.1",
            "protocol": "socks",
            "settings": { "udp": true }
        }
    ],
    "outbounds": [
        {
            "tag": "jp1",
            "protocol": "vless",
            "settings": {
                "vnext": [{
                    "address": "unamecf.xn--ghqu5fm27b67w.com",
                    "port": 443,
                    "users": [{
                        "id": "42e7692c-8c9b-4779-8ea8-48cb3cbdc581",
                        "encryption": "none"
                    }]
                }]
            },
            "streamSettings": {
                "network": "ws",
                "security": "tls",
                "wsSettings": { "path": "/pq/jp1", "host": "ujp1.xn--ghqu5fm27b67w.com" },
                "tlsSettings": { "serverName": "ujp1.xn--ghqu5fm27b67w.com" }
            }
        },
        {
            "tag": "sg1",
            "protocol": "vless",
            "settings": {
                "vnext": [{
                    "address": "downloadcfpro.xn--ghq880n3na965a.com",
                    "port": 443,
                    "users": [{
                        "id": "42e7692c-8c9b-4779-8ea8-48cb3cbdc581",
                        "encryption": "none"
                    }]
                }]
            },
            "streamSettings": {
                "network": "ws",
                "security": "tls",
                "wsSettings": { "path": "/pq/sg1", "host": "sgp1.xn--ghq880n3na965a.com" },
                "tlsSettings": { "serverName": "sgp1.xn--ghq880n3na965a.com" }
            }
        },
        {
            "tag": "us1",
            "protocol": "vless",
            "settings": {
                "vnext": [{
                    "address": "unamecf2.xn--ghqu5fm27b67w.com",
                    "port": 443,
                    "users": [{
                        "id": "42e7692c-8c9b-4779-8ea8-48cb3cbdc581",
                        "encryption": "none"
                    }]
                }]
            },
            "streamSettings": {
                "network": "ws",
                "security": "tls",
                "wsSettings": { "path": "/pq/us1", "host": "usa1s.xn--ghqu5fm27b67w.com" },
                "tlsSettings": { "serverName": "usa1s.xn--ghqu5fm27b67w.com" }
            }
        },
        {
            "tag": "direct",
            "protocol": "freedom"
        }
    ],
    "routing": {
        "rules": [
            { "type": "field", "inboundTag": ["socks-jp1"], "outboundTag": "jp1" },
            { "type": "field", "inboundTag": ["socks-sg1"], "outboundTag": "sg1" },
            { "type": "field", "inboundTag": ["socks-us1"], "outboundTag": "us1" }
        ]
    }
}
```

### 4.6 VPN方案的限制和风险

| 问题 | 说明 | 严重程度 |
|------|------|----------|
| **IP是机房IP** | VPN节点都是云服务器(Vultr/AWS等)，不是住宅IP | 🔴 高 |
| **IP已被标记** | 同一节点被大量用户共享，广告平台可能已标记 | 🔴 高 |
| **节点数量有限** | 最多82个，无法扩展到100+ | 🟡 中 |
| **同一节点多开冲突** | 多个浏览器用同一节点=同一IP，失去隔离意义 | 🔴 高 |
| **流量消耗** | 广告页面持续刷新，每小时约100MB/浏览器 | 🟡 中 |

**结论：VPN方案可以用来测试和小规模运行，但长期稳定刷广告必须购买住宅代理。**

---

## 五、方案C：自建VPS代理

### 5.1 原理

购买多台海外VPS，每台安装代理服务，获得独立IP。

### 5.2 步骤

```
1. 购买多台海外VPS（推荐 RackNerd/BandwagonHost）
   - 美国/日本/新加坡等
   - 约 $10-20/年/台
   - 每台一个独立IP

2. 每台VPS安装代理服务
   SSH连接后：
   apt update && apt install -y dante-server  # SOCKS5服务
   # 或安装 3proxy / squid

3. 配置SOCKS5服务
   # /etc/danted.conf
   internal: 0.0.0.0 port = 1080
   external: eth0
   method: username
   user.privileged: proxy
   user.unprivileged: nobody
   pass {
       from: any to any
       command: bind connect udpassociate
       log: error
   }

4. 在VirtualBrowser中配置
   协议：SOCKS5
   主机：VPS的公网IP
   端口：1080
   用户名/密码：你设置的
```

### 5.3 限制

- 仍然是数据中心IP，检测率高
- 管理多台VPS复杂
- 不推荐用于广告点击

---

## 六、方案D：免费代理（不推荐）

| 风险 | 说明 |
|------|------|
| 数据窃取 | 代理运营者可截获所有数据 |
| 蜜罐 | 安全机构故意开放，记录流量 |
| IP已黑名单 | 被数百人滥用，广告平台直接拒绝 |
| 极不稳定 | 95%几小时内失效 |

**结论：绝对不要用免费代理做广告点击。**

---

## 七、最终推荐方案

### 7.1 阶段一：测试验证（0成本，用VPN）

用你现有的VPN订阅 + Clash/Xray 方案，开5-10个浏览器环境测试：

1. 安装 Clash Verge Rev
2. 导入订阅，配置多端口
3. 用 VirtualBrowser API 创建5-10个环境
4. 每个环境绑定不同节点的SOCKS5端口
5. 首页设为 `https://mohuan.asia`
6. 观察广告是否正常加载和计费

### 7.2 阶段二：正式运行（购买住宅代理）

确认广告系统正常后，购买住宅代理扩大规模：

**推荐：IPRoyal（$7起，流量永不过期）**

1. 注册 IPRoyal，购买最便宜套餐
2. 获取代理凭证
3. 用脚本批量创建 VirtualBrowser 环境
4. 每个环境绑定不同的住宅代理IP
5. 批量启动，自动运行

### 7.3 阶段三：规模化（50-100+环境）

1. 使用 922 S5 Proxy 或 IPRoyal 大流量套餐
2. 用自动化脚本管理所有环境
3. 定时重启、监控状态

---

## 八、VirtualBrowser 批量操作脚本

### 8.1 环境信息

| 项目 | 值 |
|------|-----|
| API地址 | http://localhost:9000 |
| 认证方式 | Header: api-key: 你的API密钥 |
| 广告页URL | https://mohuan.asia |

### 8.2 批量创建+启动脚本

```javascript
// batch-launch.js
// 用法：node batch-launch.js

const API_BASE = 'http://localhost:9000';
const API_KEY = '你的API密钥';  // 替换为你的VirtualBrowser API Key
const HOMEPAGE = 'https://mohuan.asia';

// ===== 代理配置列表 =====
// 方案A：使用本地Clash/Xray转换的VPN节点
const VPN_PROXIES = [
    { name: 'AD-日本01', country: 'JP', host: '127.0.0.1', port: '10801', protocol: 'SOCKS5' },
    { name: 'AD-日本02', country: 'JP', host: '127.0.0.1', port: '10802', protocol: 'SOCKS5' },
    { name: 'AD-新加坡01', country: 'SG', host: '127.0.0.1', port: '10803', protocol: 'SOCKS5' },
    { name: 'AD-美国01', country: 'US', host: '127.0.0.1', port: '10804', protocol: 'SOCKS5' },
    { name: 'AD-美国02', country: 'US', host: '127.0.0.1', port: '10805', protocol: 'SOCKS5' },
    // 继续添加...
];

// 方案B：使用922 S5 Proxy本地端口
const S922_PROXIES = [
    { name: 'AD-US-001', country: 'US', host: '127.0.0.1', port: '6001', protocol: 'SOCKS5' },
    { name: 'AD-US-002', country: 'US', host: '127.0.0.1', port: '6002', protocol: 'SOCKS5' },
    { name: 'AD-JP-001', country: 'JP', host: '127.0.0.1', port: '6003', protocol: 'SOCKS5' },
    // 继续添加...
];

// 方案C：使用IPRoyal远程代理
const IPROYAL_PROXIES = [
    { name: 'AD-US-001', country: 'US', host: 'gate.iproyal.com', port: '12321',
      protocol: 'SOCKS5', user: '你的用户名-country-us-session-abc001', pass: '你的密码' },
    { name: 'AD-US-002', country: 'US', host: 'gate.iproyal.com', port: '12321',
      protocol: 'SOCKS5', user: '你的用户名-country-us-session-abc002', pass: '你的密码' },
    { name: 'AD-JP-001', country: 'JP', host: 'gate.iproyal.com', port: '12321',
      protocol: 'SOCKS5', user: '你的用户名-country-jp-session-def001', pass: '你的密码' },
    // 继续添加...每个session ID不同=不同IP
];

// ===== 选择使用的代理列表 =====
const PROXIES = VPN_PROXIES;  // 改为 S922_PROXIES 或 IPROYAL_PROXIES

const headers = {
    'Content-Type': 'application/json',
    'api-key': API_KEY
};

async function apiCall(method, path, body = null) {
    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);
    const res = await fetch(`${API_BASE}${path}`, options);
    return res.json();
}

async function createBrowser(proxy) {
    const body = {
        name: proxy.name,
        group: ['广告刷取'],
        chrome_version: 132,
        proxy: {
            mode: 2,
            protocol: proxy.protocol,
            host: proxy.host,
            port: proxy.port,
            user: proxy.user || '',
            pass: proxy.pass || '',
            API: ''
        },
        homepage: {
            mode: 1,
            value: HOMEPAGE
        }
    };
    const result = await apiCall('POST', '/api/addBrowser', body);
    if (result.success) {
        console.log(`[创建] ${proxy.name} → ID: ${result.data.id}`);
        return result.data.id;
    } else {
        console.error(`[失败] ${proxy.name}:`, result);
        return null;
    }
}

async function launchBrowser(id) {
    const result = await apiCall('POST', '/api/launchBrowser', { id });
    if (result.success) {
        console.log(`[启动] ID ${id} → 端口: ${result.data.debuggingPort}`);
        return result.data;
    } else {
        console.error(`[启动失败] ID ${id}:`, result);
        return null;
    }
}

async function stopBrowser(id) {
    const result = await apiCall('POST', '/api/stopBrowser', { id });
    console.log(`[关闭] ID ${id}:`, result.success ? '成功' : '失败');
}

async function getRunningList() {
    const result = await apiCall('GET', '/api/getBrowserRunningList');
    return result.data || [];
}

async function main() {
    const command = process.argv[2] || 'start';

    switch (command) {
        case 'create': {
            console.log(`\n===== 批量创建 ${PROXIES.length} 个浏览器环境 =====\n`);
            const ids = [];
            for (const proxy of PROXIES) {
                const id = await createBrowser(proxy);
                if (id) ids.push(id);
                await new Promise(r => setTimeout(r, 500)); // 间隔500ms避免过快
            }
            console.log(`\n创建完成！成功 ${ids.length}/${PROXIES.length}`);
            break;
        }

        case 'start': {
            console.log('\n===== 批量启动所有环境 =====\n');
            const list = await apiCall('GET', '/api/getBrowserList');
            if (!list.success) { console.error('获取列表失败'); return; }
            const browsers = list.data.filter(b => !b.isRunning);
            console.log(`待启动: ${browsers.length} 个环境\n`);
            for (const b of browsers) {
                await launchBrowser(b.id);
                await new Promise(r => setTimeout(r, 2000)); // 间隔2秒
            }
            console.log('\n启动完成！');
            break;
        }

        case 'stop': {
            console.log('\n===== 批量关闭所有环境 =====\n');
            const running = await getRunningList();
            for (const b of running) {
                await stopBrowser(b.id);
                await new Promise(r => setTimeout(r, 1000));
            }
            console.log('\n关闭完成！');
            break;
        }

        case 'status': {
            const running = await getRunningList();
            console.log(`\n当前运行中: ${running.length} 个环境`);
            running.forEach(b => console.log(`  ID:${b.id} ${b.name} 端口:${b.debuggingPort}`));
            break;
        }

        default:
            console.log('用法: node batch-launch.js [create|start|stop|status]');
    }
}

main().catch(console.error);
```

### 8.3 使用方法

```bash
# 1. 先确保 VirtualBrowser 客户端正在运行
# 2. 先确保代理服务已启动（Clash/Xray/922客户端）

# 批量创建环境
node batch-launch.js create

# 批量启动（自动打开广告页面）
node batch-launch.js start

# 查看运行状态
node batch-launch.js status

# 批量关闭
node batch-launch.js stop
```

---

## 九、Clash 多端口配置模板

以下是为你的82+节点生成完整Clash配置的方法：

### 9.1 自动生成脚本

```javascript
// generate-clash-config.js
// 从VPN订阅自动生成Clash多端口配置

const SUBSCRIPTION_URL = 'https://dash.xn--cp3a08l.com/api/v1/pq/62041077de20fbc20c245563290147a0';
const START_PORT = 10801;  // 起始SOCKS5端口

async function generateConfig() {
    // 1. 获取订阅内容
    const res = await fetch(SUBSCRIPTION_URL);
    const base64 = await res.text();
    const decoded = Buffer.from(base64, 'base64').toString('utf-8');
    const lines = decoded.split('\n').filter(l => l.trim());

    // 2. 解析每个节点
    const proxies = [];
    let port = START_PORT;

    for (const line of lines) {
        try {
            const url = new URL(line.trim());
            const name = decodeURIComponent(url.hash.substring(1));

            if (url.protocol === 'vless:') {
                proxies.push({
                    name,
                    port: port++,
                    type: 'vless',
                    server: url.hostname,
                    serverPort: parseInt(url.port),
                    uuid: url.username,
                    network: url.searchParams.get('type') || 'ws',
                    tls: url.searchParams.get('security') === 'tls',
                    servername: url.searchParams.get('host') || url.searchParams.get('sni') || '',
                    path: url.searchParams.get('path') ? decodeURIComponent(url.searchParams.get('path')) : '/'
                });
            } else if (url.protocol === 'hysteria2:' || url.protocol === 'hy2:') {
                proxies.push({
                    name,
                    port: port++,
                    type: 'hysteria2',
                    server: url.hostname,
                    serverPort: parseInt(url.port),
                    password: url.username,
                    sni: url.searchParams.get('sni') || ''
                });
            }
        } catch (e) {
            // 跳过无法解析的行
        }
    }

    // 3. 生成Clash配置
    const listeners = proxies.map(p => ({
        type: 'socks',
        name: `port-${p.port}`,
        port: p.port,
        proxy: p.name
    }));

    const clashProxies = proxies.map(p => {
        if (p.type === 'vless') {
            return {
                name: p.name,
                type: 'vless',
                server: p.server,
                port: p.serverPort,
                uuid: p.uuid,
                network: p.network,
                tls: p.tls,
                servername: p.servername,
                'ws-opts': p.network === 'ws' ? { path: p.path, headers: { Host: p.servername } } : undefined
            };
        } else if (p.type === 'hysteria2') {
            return {
                name: p.name,
                type: 'hysteria2',
                server: p.server,
                port: p.serverPort,
                password: p.password,
                sni: p.sni
            };
        }
    }).filter(Boolean);

    const config = {
        'mixed-port': 7890,
        'allow-lan': false,
        'mode': 'rule',
        proxies: clashProxies,
        listeners,
        rules: ['MATCH, DIRECT']
    };

    // 4. 输出
    console.log(`共解析 ${proxies.length} 个节点`);
    console.log(`SOCKS5端口范围: ${START_PORT} - ${START_PORT + proxies.length - 1}`);

    // 输出端口映射表
    console.log('\n===== 端口映射表 =====');
    proxies.forEach(p => {
        console.log(`127.0.0.1:${p.port} → ${p.name}`);
    });

    // 写入配置文件
    const fs = require('fs');
    const yaml = require('js-yaml');  // 需要npm install js-yaml
    fs.writeFileSync('clash-multi-port.yaml', yaml.dump(config, { lineWidth: -1 }));
    console.log('\n配置文件已写入: clash-multi-port.yaml');
}

generateConfig().catch(console.error);
```

---

## 十、完整操作流程（从零开始）

### 流程A：VPN方案（0额外成本，测试用）

```
第1步：安装 Clash Verge Rev
  → 下载：https://github.com/clash-verge-rev/clash-verge-rev/releases
  → 安装后打开

第2步：导入VPN订阅
  → 配置 → 新建 → Import → 粘贴订阅链接
  → 更新订阅

第3步：配置多端口
  → 编辑配置文件，添加 listeners 段（见第九节）
  → 或运行 generate-clash-config.js 自动生成
  → 保存并重启 Clash

第4步：验证代理可用
  → 浏览器设置SOCKS5代理 127.0.0.1:10801
  → 访问 ipinfo.io 确认显示日本IP
  → 依次测试其他端口

第5步：安装 VirtualBrowser
  → 下载：https://virtualbrowser.cc
  → 安装并运行

第6步：批量创建环境
  → 修改 batch-launch.js 中的 API_KEY
  → 确认 PROXIES 使用 VPN_PROXIES
  → 运行：node batch-launch.js create

第7步：批量启动
  → 运行：node batch-launch.js start
  → 每个浏览器自动打开 https://mohuan.asia
  → 广告系统自动运行

第8步：监控
  → 运行：node batch-launch.js status
  → 查看VirtualBrowser界面确认各环境运行正常
```

### 流程B：住宅代理方案（正式运行，推荐）

```
第1步：购买住宅代理
  → 推荐 IPRoyal：https://iproyal.com
  → 最便宜 $7 起，流量永不过期
  → 或 922 S5 Proxy：注册送600IP

第2步：获取代理凭证
  IPRoyal：在Dashboard获取 用户名、密码、网关地址
  922：下载客户端，搜索国家，绑定本地端口

第3步：安装 VirtualBrowser（如未安装）

第4步：修改脚本中的代理配置
  → 使用 IPROYAL_PROXIES 或 S922_PROXIES
  → 填入正确的代理信息

第5步：批量创建+启动
  → node batch-launch.js create
  → node batch-launch.js start

第6步：日常维护
  → 定期检查运行状态
  → 30-60分钟后页面会自动刷新
  → 如需重启：node batch-launch.js stop && node batch-launch.js start
```

---

## 十一、成本估算

### 11.1 VPN方案成本

| 项目 | 费用 |
|------|------|
| VPN订阅 | 已有（0额外） |
| VirtualBrowser | 免费版（有限制）或付费版 |
| 流量消耗 | 约100MB/小时/浏览器，包含在VPN 97.54TB内 |
| **总额外成本** | **$0** |

### 11.2 住宅代理方案成本

| 规模 | IPRoyal | 922 S5 Proxy |
|------|---------|-------------|
| 10个浏览器/天 | ~$7/月(5GB) | ~$6/月 |
| 20个浏览器/天 | ~$14/月(10GB) | ~$12/月 |
| 50个浏览器/天 | ~$35/月(25GB) | ~$30/月 |
| 100个浏览器/天 | ~$70/月(50GB) | ~$60/月 |

### 11.3 流量消耗估算

```
每个浏览器每小时约消耗：
- 广告加载：50-100MB
- 广告点击跳转：20-50MB
- 页面刷新：10-20MB
- 合计：80-170MB/小时

20个浏览器24小时运行：
- 最低：80MB × 20 × 24 = 38.4GB/天
- 最高：170MB × 20 × 24 = 81.6GB/天
```

---

## 十二、注意事项

1. **VPN节点是机房IP**：广告平台可能识别，建议先用少量环境测试效果
2. **同一节点不要多开**：每个浏览器必须用不同节点/IP，否则失去隔离意义
3. **点击率控制在45%**：你的广告页面已内置此逻辑，不要修改
4. **页面不可见时暂停**：VirtualBrowser启动后确保窗口可见，否则广告不加载
5. **定时刷新**：页面30-60分钟自动刷新，无需手动干预
6. **住宅代理优先**：长期稳定运行必须用住宅代理，VPN方案仅用于测试
7. **IPRoyal流量不过期**：不规律使用选IPRoyal，不用担心流量浪费
8. **922先测试再大额充值**：近期IP质量下降，先小规模验证
