# 老王订阅管理系统

<p align="center">
  <img src="https://img.shields.io/badge/Vue_3-35495E?style=for-the-badge&logo=vue.js&logoColor=4FC08D" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white" />
  <br/>
  <a href="https://github.com/tony-wang1990/laowang-subscription/issues">🐛 提交问题</a>
</p>

> **高颜值的私有化订阅管理系统。集中管理您的 VPS、域名、SSL 证书及各类会员服务，支持 Telegram、微信、邮件等多渠道到期自动提醒，防止服务意外中断。**

---

## ✨ 功能特性

- **🎨 现代化界面**: 精心设计的 UI，支持 **深色模式**、**浅色模式** 及 **跟随系统**
- **🔔 多渠道通知**: 内置 **Telegram**、**微信 (Server酱/企业微信)**、**邮件**、**Bark** 及自定义 **Webhook**
- **📅 灵活订阅周期**: 支持按天、月、年设置，甚至支持永久订阅或一次性订阅
- **📊 仪表盘概览**: 直观的操作界面，支持搜索、筛选、分类管理
- **🔐 私有化安全**: 数据存储在本地 SQLite 数据库，无需担心隐私泄露
- **☁️ 天气与农历**: 贴心的内置天气显示与农历日期支持

---

## 📸 界面预览

### 仪表盘
| 浅色模式 | 深色模式 |
| :---: | :---: |
| ![浅色](docs/images/dashboard_light.png) | ![深色](docs/images/dashboard_dark.png) |

### 设置页面
| 通用设置 | 通知配置 |
| :---: | :---: |
| ![设置浅色](docs/images/settings_light.png) | ![设置深色](docs/images/settings_dark.png) |

---

## 🚀 部署方式

### 方式一：Zeabur 部署（推荐）

无需服务器，适合新手用户。

**部署步骤：**

1. 登录 [Zeabur 控制台](https://zeabur.com)
2. 创建新项目，选择 **"从 GitHub 部署"**
3. 搜索并选择 `laowang-subscription` 仓库
4. 等待自动构建完成（约 1-2 分钟）
5. 绑定域名后即可访问

> ⚠️ **注意**: 需要 Fork 本仓库到你的 GitHub 账户，或直接导入仓库 URL。

---

### 方式二：Docker Compose 部署

适用于有 Docker 环境的 VPS (Linux/Mac/Windows)。

```bash
# 1. 克隆仓库
git clone https://github.com/tony-wang1990/laowang-subscription.git
cd laowang-subscription

# 2. 一键启动
docker-compose up -d
```

启动后访问 `http://your-ip:3000` 即可使用。

---

### 方式三：手动部署 (Node.js)

适用于 Linux VPS 或本地环境（需安装 Node.js 18+）。

```bash
# 1. 克隆仓库
git clone https://github.com/tony-wang1990/laowang-subscription.git
cd laowang-subscription

# 2. 安装依赖并构建前端
npm install
npm run build

# 3. 启动服务
npm start
```

---

## 🛠️ 本地开发

```bash
# 克隆代码
git clone https://github.com/tony-wang1990/laowang-subscription.git
cd laowang-subscription

# 安装依赖
npm install

# 启动开发服务器（同时启动前端 Vite 和后端 Express）
npm run dev
```

---

## 📝 常见问题

### 默认账号密码是什么？

默认管理员账号：`admin`，密码：`admin`  
首次登录后请立即在"设置"页面修改密码。

### Cloudflare Pages 可以部署吗？

**不可以**。本项目包含后端服务 (Express + SQLite)，Cloudflare Pages 仅支持纯静态网页。  
推荐使用 Zeabur、Railway、Fly.io 或自建 VPS。

### Zeabur 部署失败怎么办？

常见原因及解决方法：

1. **Node.js 版本问题**  
   本项目需要 Node.js 18+，请在 Zeabur 项目设置中手动指定 Node 版本。

2. **构建超时**  
   首次构建可能需要较长时间，请耐心等待。

3. **依赖安装失败**  
   检查网络连接，或尝试重新部署。

### 如何添加 HTTPS？

- **Zeabur**: 绑定域名后自动配置 SSL
- **自建 VPS**: 推荐使用 Nginx + Let's Encrypt 反向代理

---

## 🤝 贡献与支持

欢迎提交 Pull Request 或 Issue！

## 📄 开源协议

MIT License
