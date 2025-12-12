# 老王订阅转换前端 (LaoWang Subscription)

这是一个基于 Vue 3 + Express 的订阅转换前端项目，专为 [SubConverter](https://github.com/tindy2013/subconverter) 设计。它提供了现代化的用户界面，支持深色模式、多语言（中/英），并集成了丰富的配置选项。

<p align="center">
  <a href="https://test.199060.xyz/" target="_blank">
    <img src="https://img.shields.io/badge/🔗_点击体验_DEMO-TEST.199060.XYZ-38b2ac?style=for-the-badge" alt="Demo">
  </a>
</p>

![老王订阅转换](https://raw.githubusercontent.com/tony-wang1990/laowang-subscription/main/screenshot.png)

## ✨ 特性

-   🎨 **现代化 UI**: 采用 Tailwind CSS 构建，支持深色/浅色模式自动切换。
-   📱 **响应式设计**: 完美适配桌面端和移动端。
-   🌍 **多语言支持**: 内置英语和简体中文，根据浏览器语言自动切换。
-   🛠️ **强大配置**: 支持 SubConverter 所有主流配置项（远程配置、后端地址、包含/排除节点、文件名等）。
-   ⚡ **实时预览**: 配置更改变动即时反映在生成的链接中。
-   🔗 **短链接集成**: 完美支持 MyUrls 等短链接服务。
-   🐳 **Docker 部署**: 提供多架构 (AMD64/ARM64) 镜像，一键部署。

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
