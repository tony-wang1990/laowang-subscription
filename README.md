# 老王订阅管理系统 (LaoWang Subscription) v1.2

> **一个用于管理续费、到期提醒的私有化部署工具**

你是否经常遇到以下问题？
- ❌ 域名悄悄到期，网站打不开才发现。
- ❌ 忘记取消试用的 Netflix/Spotify 会员，白白扣费。
- ❌ VPS 服务器太多，记不清哪台机器什么时候到期。
- ❌ 信用卡办太多，错过了免息还款日。

**LaoWang Subscription** 就是为了解决这些问题而生的。它是一个基于 Vue 3 + Express 的全栈订阅管理系统，不仅仅是一张简单的Excel表格，它拥有**真正的后端检测能力**，能通过微信、Telegram 等渠道精准地提醒你"该交保护费了"！

<p align="center">
  <a href="https://test.199060.xyz/" target="_blank">
    <img src="https://img.shields.io/badge/🔗_在线演示-test.199060.xyz-blue?style=for-the-badge&logo=google-chrome&logoColor=white" alt="Demo">
  </a>
</p>

---

## 📸 界面预览

### 列表视图 (少女主题)
![列表视图](docs/images/dashboard_light.png)

### 卡片视图 (卡通主题)
![卡片视图](docs/images/dashboard_dark.png)

---

## ✨ 核心功能

### 1. 📅 精准的订阅周期管理
- **周期支持**：年付、月付、日滚、一次性
- **自动续费**：到期后自动延长周期，无需手动修改

### 2. 📢 多渠道即时通知
- **Telegram Bot**：即时消息推送
- **WeChat (企业微信)**：国内最稳的推送通道
- **Bark (iOS)**：苹果用户神器
- **Webhook**：自定义接入

### 3. 💰 资产与费用统计
- **多币种支持**：CNY, USD, HKD, JPY, EUR 等
- **续费价格显示**：一眼看清每个订阅的续费成本

### 4. 🎨 多彩主题系统 (v1.3 新增)
- 🚀 **太空** - 深邃星空紫
- 💫 **霓虹** - 炫彩红黄
- 🍬 **糖果** - 柔和彩虹
- 🌸 **少女** - 粉嫩梦幻
- 🤖 **科幻** - 青紫赛博
- 🎨 **卡通** - 欢乐多彩

### 5. 🔄 双视图切换 (v1.2 新增)
- **≡ 列表视图**：传统表格布局
- **⊞ 卡片视图**：现代网格布局

---

## 🚀 更新日志

### v1.2 (Latest)

> **亮点**：全新多彩主题 + 双视图切换 + 固定头部 + 多项BUG修复

#### 🆕 新功能
- **8 款多彩主题**：太空、霓虹、糖果、少女、海洋、科幻、卡通 + 深浅色
- **卡片视图**：≡ 列表 / ⊞ 卡片 一键切换
- **固定头部和工具栏**：滚动时仅内容区域滚动，头部保持可见
- **三端响应式适配**：桌面(4列)、平板(2列)、手机(单列)完美显示

#### 🔧 UI 优化
- "价格" 改为 "续费价格"
- 价格格式改为 `10 USD` 样式
- 卡片统一高度和一致对齐
- 移除导航栏"列表"按钮（修复抖动BUG）
- 视图切换图标改为 ≡ 和 ⊞

#### 🐛 Bug 修复
- **修复删除按钮无响应**：移除被浏览器阻止的 confirm 弹窗
- **修复停用/启用页面跳动**：直接更新本地状态，不重新加载列表
- **修复弹窗点击外部关闭**：弹窗仅能通过按钮关闭
- **修复卡片文字不对齐**：左侧标签左对齐，右侧数值右对齐

---

### v1.1

> **重要**：从 v1.0 升级的用户，系统会自动迁移数据库。

- 🆕 **新增字段**：周期、价格、货币、自动续费、备注
- 🆕 **功能增强**：自动续费逻辑、农历显示开关、天气源优化
- 🐛 **Bug修复**：数据库缺字段启动崩溃、日期显示重复

---

### v1.0

- 🎉 **首次发布**
- 基础订阅管理功能
- 多渠道通知支持
- Docker 一键部署

---

## 🚀 部署指南 (推荐 Docker)

### 方式一：Docker Run (最快)

```bash
docker run -d \
  --name laowang-subscription \
  -p 8080:8080 \
  --restart always \
  -v $(pwd)/database:/app/database \
  -e TZ=Asia/Shanghai \
  ghcr.io/tony-wang1990/laowang-subscription:main
```

### 方式二：Docker Compose (推荐)

创建 `docker-compose.yml`：

```yaml
version: '3'
services:
  app:
    image: ghcr.io/tony-wang1990/laowang-subscription:main
    container_name: laowang-subscription
    restart: always
    ports:
      - "8080:8080"
    volumes:
      - ./database:/app/database
    environment:
      - TZ=Asia/Shanghai
```

启动：
```bash
docker-compose up -d
```

### 🔄 如何自动更新？
推荐使用 **Watchtower** 实现全自动更新：
```bash
docker run -d \
    --name watchtower \
    --restart always \
    -v /var/run/docker.sock:/var/run/docker.sock \
    containrrr/watchtower \
    --cleanup \
    --interval 3600 \
    laowang-subscription
```

> ⚠️ **关于其他容器平台**：由于本项目使用 SQLite 原生模块，Zeabur、Railway、Vercel 等 Serverless 平台可能出现编译失败或运行时崩溃的问题，**推荐使用 Docker 部署**。

---

## ⚙️ 环境变量
| 变量名 | 默认值 | 说明 |
| :--- | :--- | :--- |
| `PORT` | 8080 | 服务端口 |
| `JWT_SECRET` | 随机 | Session密钥 |
| `TZ` | UTC | 时区 (建议设置 Asia/Shanghai) |

---

## 🤝 贡献与支持
觉得好用请点个 ⭐️ Star！有问题欢迎提 Issue。
License: MIT
