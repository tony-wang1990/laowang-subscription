# 老王订阅管理系统 (LaoWang Subscription) v1.1

基于 Vue 3 + Express 的一站式订阅管理系统。不仅是一个前端看板，更包含完整的后端逻辑，支持订阅状态检测、自动续期、多渠道通知等核心功能。

<p align="center">
  <a href="https://test.199060.xyz/" target="_blank">
    <img src="https://img.shields.io/badge/🔗_在线演示-test.199060.xyz-blue?style=for-the-badge&logo=google-chrome&logoColor=white" alt="Demo">
  </a>
</p>

## 🚀 v1.1 更新日志 (Latest)

本次更新集中修复了先前版本 (`v1.0`) 初始化脚本缺失字段导致无法运行的问题，并新增了大量实用功能：

### 🆕 新增功能
1.  **订阅字段扩展**：新增 `周期 (Cycle)`、`价格 (Price)`、`货币 (Currency)`、`自动续费 (Auto-Renew)`、`备注 (Note)` 等字段，管理更精细。
2.  **货币选择器**：支持 CNY, USD, HKD, EUR, JPY, GBP 等主流货币选择。
3.  **自动续费逻辑**：后端新增定时任务，针对开启“自动续费”的订阅，到期后自动更新有效期（支持按年/月/日/永久 逻辑）。
4.  **农历日期支持**：通知消息现在可以根据设置显示农历日期（需在设置中开启）。
5.  **智能天气源**：重构天气获取逻辑，增加了多重备用源 (Open-Meteo 等)，解决天气显示不稳定的问题。

### 🐛 修复与优化
1.  **✅ 修复数据库崩溃问题**：修复了 `v1.0` 版本 `schema.sql` 缺失字段导致启动报错 (`SQLITE_ERROR: table subscriptions has no column named cycle`) 的严重 Bug. **现在系统会自动检查并迁移旧数据库，旧版本用户可无缝升级。**
2.  **界面优化**：修复了列表页日期重复显示的问题；移除了天气组件中冗余的地理位置文字；移除了列表标签中多余的“公历”字样。
3.  **稳定性修复**：修复了特定情况下保存订阅导致后端 crash 的问题。

---

## 📸 界面预览

### 桌面端预览

| 浅色模式 | 深色模式 |
| :---: | :---: |
| ![Light](docs/images/dashboard_light.png) | ![Dark](docs/images/dashboard_dark.png) |


## ✨ 核心特性

-   🎨 **现代化 UI**: 采用 Tailwind CSS 构建，支持深色/浅色模式自动切换。
-   ⚙️ **核心逻辑**: 真正的后端管理，支持 Cron 定时任务检测过期订阅。
-   📢 **多渠道通知**: 支持 Telegram, Wechat (企业微信), Bark (iOS), Webhook 通知。
-   🌚 **农历支持**: 适合中国用户习惯，支持农历日期显示。
-   🔄 **自动续费**: 支持订阅周期管理，自动延长有效期，无需手动修改。
-   🌍 **多语言**: 支持中英双语切换。
-   🐳 **Docker**: 提供多架构 (AMD64/ARM64) 镜像，一键部署。

## 🚀 部署指南 (VPS)

本项目推荐使用 Docker 在 VPS 上进行部署。支持甲骨文 ARM (Oracle ARM) 及常规 AMD64 服务器。

### 前置要求

-   一台拥有公网 IP 的 Linux 服务器 (VPS)
-   已安装 [Docker](https://docs.docker.com/get-docker/) 和 [Docker Compose](https://docs.docker.com/compose/install/)

### 方式一：Docker Run (最简方式)

直接运行以下命令即可启动服务：

```bash
docker run -d \
  --name laowang-subscription \
  -p 8080:8080 \
  --restart always \
  -v ./database:/app/database \
  ghcr.io/tony-wang1990/laowang-subscription:main
```

-   启动后，访问 `http://IP:8080` 即可。
-   数据文件会保存在当前目录下的 `database` 文件夹中。

### 方式二：Docker Compose (推荐)

在服务器上创建一个 `docker-compose.yml` 文件：

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

然后运行：

```bash
docker-compose up -d
```

### 🔄 如何更新

当项目均有更新（发布新镜像）时，在 VPS 上执行以下命令即可无损升级：

#### Docker Compose (推荐)

```bash
# 1. 拉取最新镜像
docker-compose pull

# 2.重新创建容器 (不会删除数据)
docker-compose up -d --force-recreate

# 3. 清理旧镜像 (可选)
docker image prune -f
```

#### Docker Run

```bash
# 1. 停止并删除容器
docker stop laowang-subscription
docker rm laowang-subscription

# 2. 拉取最新镜像
docker pull ghcr.io/tony-wang1990/laowang-subscription:main

# 3. 重新运行命令 (把之前的 docker run 命令再跑一遍)
docker run -d ...
```

### 方式三：手动构建

如果您想自己构建镜像：

```bash
git clone https://github.com/tony-wang1990/laowang-subscription.git
cd laowang-subscription
docker build -t laowang-subscription .
docker run -d -p 8080:8080 laowang-subscription
```

## 🛠️ 环境变量

| 变量名 | 默认值 | 描述 |
| :--- | :--- | :--- |
| `PORT` | 8080 | 服务监听端口 |
| `JWT_SECRET` | 随机生成 | 用于 session 加密的密钥 (可选) |
| `WEB_PORT` | - | 用于 Web 界面显示的端口 (通常无需设置) |

## 📦 架构说明

-   **Frontend**: Vue 3, Vite, Tailwind CSS
-   **Backend**: Node.js, Express, SQLite (better-sqlite3 / sqlite3)
-   **Database**: SQLite (存储订阅历史和设置)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License
