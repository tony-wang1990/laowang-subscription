# Changelog

## v1.5.0 — 2026-11-24

### 安全修复（Security）

- **删除默认管理员口令**：首次启动不再创建固定口令账号。用户表为空时自动创建 `admin` 账号并生成随机强口令，**仅在启动日志中打印一次**，请立即登录修改。无任何默认口令。
- **注册接口收紧**：`POST /api/auth/register` 仅在用户数为 0 时可用；已有用户后返回 403。
- **改密加固**：新密码最短 8 位（原 4 位）；改密必须提供并校验当前密码，不提供当前密码不得直接改密。
- **设置接口脱敏**：`GET /api/settings` 对 Token / 密码 / 密钥类字段（`api_token`、`telegram_token`、`bark_url`、`webhook_url`、`wechat_key`、`email_pass`）只返回 `{ configured: true/false }`，不再返回原始值；`POST /api/settings` 增加白名单校验，只接受已知字段，未知 key 返回 400。
- 前端配套：设置页密钥字段不再回填原值，留空保存表示不改动；改密表单新增“当前密码”输入。
- `docker-compose.yml` 删除公开的占位密钥，`JWT_SECRET` 改为由用户设置。

### 部署与工程

- `docker-compose.yml` 端口统一为 `3001:3001`，镜像改为 `ghcr.io/tony-wang1990/laowang-subscription:main`，与 README / Dockerfile 一致。
- 补 `LICENSE` 文件（MIT，与 README 徽章一致）；`package.json` 的 `license` 由 ISC 改为 MIT。
- Dockerfile：生产依赖改用 `npm ci --omit=dev`；改用非 root 用户（`node`）运行；数据库目录权限由 `777` 改为 `755`（属主 `node`）；新增 `HEALTHCHECK`（`/api/health`）；新增 `.dockerignore`。
- 删除未被代码引用的 npm 占位依赖 `crypto@^1.0.1`（代码中唯一的 `require('crypto')` 解析为 Node.js 内置模块，与该 npm 包无关）。
- 空库默认不再自动灌入演示数据；仅 `DEMO_DATA=1` 时灌入。
- README：引用已有的设置页截图 `docs/images/settings_{dark,light}.png`；修正 Node 版本要求为 `>= 20`（与 `package.json` 的 `engines` 一致）；补全环境变量表；新增安全说明与英文 Quick Start。
- 新增 Issue 模板（`.github/ISSUE_TEMPLATE/bug_report.md`）与最小安全回归测试（`test-security.js`）。

### 已评估、未升级（Not upgraded）

- `sqlite3` 5.x → 6.x、`nodemailer` 7.x → 10.x、`express` 4.x → 5.x：均为大版本升级，存在破坏性变更风险，需单独做兼容测试与回归验证，本次未升级。
- `cors()` 全开、`express.json()` 未限大小、无全局限流、`POST /api/notify/:token` 把 Token 放在 URL 路径中、`/tmp` 数据库降级、崩溃直接 `process.exit(1)` 等问题本次未改，见审计报告。

### 兼容性提示（Breaking changes）

- 升级后首次启动会生成新的随机管理员口令，旧的默认口令登录方式失效；请查看启动日志获取初始口令并立即修改。
- 设置页保存时，已配置的密钥字段留空即视为不改动；如需修改请重新输入完整值。
- 改密必须提供当前密码；新密码至少 8 位。
