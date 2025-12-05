# LaoWang Subscription Reminder | 老王订阅管理系统

<p align="center">
  <img src="https://img.shields.io/badge/Vue_3-35495E?style=for-the-badge&logo=vue.js&logoColor=4FC08D" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white" />
  <br/>
  <a href="https://your-demo-url.com">👀 查看演示 Demo</a> &nbsp;|&nbsp; 
  <a href="https://github.com/tony-wang1990/laowang-subscription/issues">🐛 提交 Issue</a>
</p>

⚠️ **Wait for update**
> **Demo URL**: [https://laowang.zeabur.app](https://laowang.zeabur.app) (示例链接，部署后请替换)

High-performance, self-hosted subscription management system. Track your VPS, domains, software licenses, memberships, and more with multi-channel notifications.

高性能、可私有化部署的订阅管理系统。支持管理 VPS、域名、软件授权、会员等，提供多渠道到期提醒。

---

## ✨ Features (功能特性)

- **🎨 Modern UI**: Beautiful interface with Dark/Light/System theme support. (炫酷的现代化 UI，支持深色/浅色/跟随系统模式)
- **🔔 Multi-Channel Notifications**: Telegram, Wechat, Email, Bark, Custom Webhook. (支持多种通知渠道)
- **📅 Smart Reminders**: Customizable reminder cycles (Days, Months, Years). (自定义灵活的提醒周期)
- **📊 Dashboard**: Overview of all subscriptions with categories and status. (直观的仪表盘概览)
- **🔐 Secure**: Self-hosted data, local SQLite database. (数据私有化，安全可控)
- **☁️ Weather & Lunar**: Built-in weather and Lunar calendar display. (内置天气与农历显示)

---

## 📸 Screenshots (界面预览)

### Dashboard (Light / Dark)
| Light Mode | Dark Mode |
|Data | Data |
| ![Light](docs/images/dashboard_light.png) | ![Dark](docs/images/dashboard_dark.png) |

### Settings
| General Settings (Light) | Notification Config (Dark) |
|Data | Data |
| ![Settings Light](docs/images/settings_light.png) | ![Settings Dark](docs/images/settings_dark.png) |

---

## 🚀 One-Click Deployment (一键部署)

### 1. Zeabur (Recommended)
You can deploy this project to Zeabur with one click. 
推荐使用 Zeabur 进行部署，无需配置服务器。

[![Deploy on Zeabur](https://zeabur.com/button.svg)](https://zeabur.com/templates/XXXXXX)
*(Note: Replace with your actual Zeabur template link if available)*

### 2. Docker Compose
Deploy using Docker Compose on any VPS.

```bash
# 1. Clone repository
git clone https://github.com/tony-wang1990/laowang-subscription.git
cd laowang-subscription

# 2. Start services
docker-compose up -d
```

Access at `http://your-ip:3000`

### 3. Shell Script (Linux VPS)
Run the following command to install dependencies and start the app (Requires Node.js installed):

```bash
git clone https://github.com/tony-wang1990/laowang-subscription.git
cd laowang-subscription
npm install
npm install --production
npm start
```

---

## 🛠️ Local Development (本地开发)

Prerequisites: Node.js 16+, Git.

```bash
# Clone repo
git clone https://github.com/tony-wang1990/laowang-subscription.git

# Install dependencies
npm install

# Start development server (Frontend + Backend)
npm run dev
```

---

## 📝 Cloudflare Deployment
Currently, this project requires a Node.js runtime (Express + SQLite). It **cannot** be hosted on Cloudflare Pages (Static) directly without modification. We recommend using a VPS or Container Platform (Zeabur, Railway, Fly.io).

---

## 🤝 Contributing

Contributions are welcome! Please run `npm run dev` to test changes before submitting a PR.
欢迎提交 PR！

## 📄 License

MIT License.
