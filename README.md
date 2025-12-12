# 老王订阅管理系统

<p align="center">
  <img src="https://img.shields.io/badge/版本-v1.1.0-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Vue_3-35495E?style=for-the-badge&logo=vue.js&logoColor=4FC08D" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white" />
  <br/>
  <a href="https://github.com/tony-wang1990/laowang-subscription/issues">🐛 提交问题</a>
</p>

> **高颜值的私有化订阅管理系统。集中管理您的 VPS、域名、SSL 证书及各类会员服务，支持 Telegram、微信、Bark 等多渠道到期自动提醒，防止服务意外中断。**

---

## ✨ 功能特性

- **🎨 9种主题风格**: 浅色、深色、海洋、森林、落日、樱花、薰衣草、极简、赛博朋克
- **🔔 多渠道通知**: 内置 **Telegram**、**企业微信**、**Bark (iOS)**、自定义 **Webhook**
- **📅 灵活订阅周期**: 支持按天、月、年设置，支持永久或一次性订阅
- **📊 仪表盘概览**: 直观的操作界面，支持搜索、筛选、分类管理
- **📱 移动端适配**: 完美支持手机和平板访问
- **🌤️ 实时天气**: 自动获取并显示当前天气信息
- **🔐 私有化安全**: 数据存储在本地 SQLite 数据库

---

## 📸 界面预览

### 🌐 在线演示

<p>
  <a href="https://demo-sub.zeabur.app/" target="_blank">
    <img src="https://img.shields.io/badge/🔗_点击体验_DEMO-DEMO--SUB.ZEABUR.APP-38b2ac?style=for-the-badge" alt="Demo">
  </a>
</p>

> 默认账号：`admin` / 密码：`admin`

### 桌面端预览
| 浅色模式 | 深色模式 |
| :---: | :---: |
| ![浅色](docs/images/dashboard_light.png) | ![深色](docs/images/dashboard_dark.png) |

### 设置页面
| 通用设置 | 通知配置 |
| :---: | :---: |
| ![设置浅色](docs/images/settings_light.png) | ![设置深色](docs/images/settings_dark.png) |

---

## 📋 更新日志

### v1.1.0 (2025-12-12)

#### 🆕 新增功能
- **9种主题背景**: 新增海洋、森林、落日、樱花、薰衣草、极简、赛博朋克主题
- **完整通知支持**: 新增 Bark (iOS)、Webhook、企业微信通知渠道
- **实时天气显示**: 接入 wttr.in API，每10分钟自动更新
- **移动端响应式**: 完整的手机/平板适配，Header胶囊布局
- **动态定时任务**: 支持自定义 Cron 表达式配置提醒时间

#### 🐛 修复问题
- 修复测试通知按钮不发送真实通知的问题
- 修复 API 代理端口配置错误
- 修复 Docker 端口映射错误 (3000 → 8080)

### v1.0.0 (2024-12-08)
- 初始版本发布
- 支持订阅管理、分类、搜索
- Telegram 通知支持
- 深色/浅色主题

---

## 🚀 部署方式

### 方式一：Zeabur（推荐 ⭐）

支持中文界面，国内访问速度快。

**部署步骤：**
1. 登录 [Zeabur](https://zeabur.com)
2. 点击 "Create Project" → "Deploy from GitHub"
3. 授权并选择 `laowang-subscription` 仓库
4. 等待部署完成，点击生成的域名访问

> 💡 项目已包含 `zeabur.json` 配置文件，自动识别配置。

---

### 方式二：Docker Compose（VPS 推荐）

适用于有 Docker 环境的 VPS。

```bash
# 克隆仓库
git clone https://github.com/tony-wang1990/laowang-subscription.git
cd laowang-subscription

# 一键启动
docker-compose up -d
```

启动后访问 `http://your-ip:8080` 即可使用。

---

### 方式三：手动部署 (Node.js)

适用于 Linux VPS（需安装 Node.js 20+）。

```bash
git clone https://github.com/tony-wang1990/laowang-subscription.git
cd laowang-subscription

npm install
npm run build
npm start
```

服务默认运行在 8080 端口。

---

## 🛠️ 本地开发

```bash
git clone https://github.com/tony-wang1990/laowang-subscription.git
cd laowang-subscription
npm install
npm run dev
```

- 前端: http://localhost:5173
- 后端: http://localhost:8080

---

## 📝 常见问题

### 默认账号密码是什么？

默认管理员账号：`admin`，密码：`admin`  
首次登录后请立即在"设置"页面修改密码。

### 通知什么时候发送？

- 默认每天 **北京时间 9:00** 执行检查
- 可在设置中自定义 Cron 表达式
- 满足以下条件会发送通知：
  - 剩余天数等于设置的提醒天数
  - 到期当天（如果提醒天数不为0）
  - 过期1-3天内

### 如何添加 HTTPS？

推荐使用 Nginx + Let's Encrypt 反向代理。

### 数据存储在哪里？

数据存储在 SQLite 数据库文件中（`database/subscription.db`）。  
建议定期备份此文件。

---

## 🤝 贡献与支持

欢迎提交 Pull Request 或 Issue！

## 📄 开源协议

MIT License
