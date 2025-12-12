<template>
  <div class="settings-container">
    <header class="settings-header">
      <div class="header-left">
        <button class="back-btn" @click="router.push('/')">← 返回</button>
        <h1>系统配置</h1>
      </div>
      <div class="header-right">
        <button class="btn-logout" @click="logout">退出登录</button>
      </div>
    </header>
    
    <main class="settings-content">
      <!-- 1. 管理员账户 -->
      <section class="config-card">
        <div class="card-title">管理员账户</div>
        <div class="card-body">
          <div class="form-row">
            <div class="form-group">
              <label>用户名</label>
              <input v-model="account.username" type="text" disabled>
            </div>
            <div class="form-group">
              <label>密码</label>
              <input v-model="account.password" type="password" placeholder="如不修改密码，请留空">
              <p class="help-text">留空表示不修改当前密码</p>
            </div>
          </div>
          <div class="action-row">
             <button class="btn-primary" @click="updateAccount">更新账户信息</button>
          </div>
        </div>
      </section>

      <!-- 2. 显示与时区 -->
      <section class="config-card">
        <div class="card-title">显示与时区</div>
        <div class="card-body">
          <div class="form-group checkbox-group">
             <label class="checkbox-label">
               <input type="checkbox" v-model="config.show_lunar"> 在通知中显示农历日期
             </label>
             <p class="help-text">控制是否在通知消息中包含农历日期信息</p>
          </div>
          
          <div class="divider"></div>
          
          <div class="form-group">
            <label>时区选择</label>
            <select v-model="config.timezone">
              <option value="Asia/Shanghai">中国标准时间 (UTC+8)</option>
              <option value="UTC">世界协调时间 (UTC)</option>
              <option value="America/New_York">美国东部时间 (UTC-5)</option>
            </select>
            <p class="help-text">选择需要使用时区，系统会按该时区计算剩余时间</p>
          </div>
        </div>
      </section>

      <!-- 3. 通知设置 -->
      <section class="config-card">
        <div class="card-title">通知设置</div>
        <div class="card-body">
          <div class="form-group">
            <label>通知时段 (Cron 表达式 UTC)</label>
            <input v-model="config.cron_expression" type="text" placeholder="0 16 * * *">
            <div class="info-box">
              <p>提示：Cloudflare Workers Cron 以 UTC 计算，例如北京时间 08:00 需设置 Cron 为 0 0 * * *。</p>
            </div>
          </div>
          
          <div class="form-group">
            <label>通知方式 (可多选)</label>
            <div class="channels-grid">
              <label class="channel-item"><input type="checkbox" v-model="config.enable_telegram"> Telegram</label>
              <label class="channel-item"><input type="checkbox" v-model="config.enable_bark"> Bark (iOS)</label>
              <label class="channel-item"><input type="checkbox" v-model="config.enable_webhook"> Webhook 通知</label>
              <label class="channel-item"><input type="checkbox" v-model="config.enable_wechat"> 企业微信机器人</label>
            </div>
          </div>
          
          <div class="form-group">
            <label>第三方 API 访问令牌</label>
            <input v-model="config.api_token" type="text" placeholder="建议使用随机字符串...">
            <p class="help-text">调用 /api/notify/{token} 接口时需携带此令牌</p>
          </div>
        </div>
      </section>

      <!-- 4. 具体通道配置 (根据勾选显示) -->
      
      <!-- Telegram -->
      <section class="config-card highlight-border" v-if="config.enable_telegram">
        <div class="card-title">Telegram 配置</div>
        <div class="card-body">
          <div class="form-row">
            <div class="form-group">
              <label>Bot Token</label>
              <input v-model="config.telegram_token" type="text">
            </div>
            <div class="form-group">
              <label>Chat ID</label>
              <input v-model="config.telegram_chat_id" type="text">
            </div>
          </div>
          <div class="action-row">
             <button class="btn-test" @click="testChannel('telegram')">🚀 测试 Telegram 通知</button>
          </div>
        </div>
      </section>



      <!-- Bark -->
      <section class="config-card highlight-border" v-if="config.enable_bark">
        <div class="card-title">Bark 配置 (iOS)</div>
        <div class="card-body">
          <div class="form-group">
            <label>Bark Server URL</label>
            <input v-model="config.bark_url" type="text" placeholder="https://api.day.app/YourKey/">
            <p class="help-text">从 Bark App 获取的推送 URL</p>
          </div>
          <div class="action-row">
             <button class="btn-test" @click="testChannel('bark')">🚀 测试 Bark 通知</button>
          </div>
        </div>
      </section>

      <!-- Webhook -->
      <section class="config-card highlight-border" v-if="config.enable_webhook">
        <div class="card-title">Webhook 配置</div>
        <div class="card-body">
          <div class="form-group">
            <label>Webhook URL</label>
            <input v-model="config.webhook_url" type="text" placeholder="https://your-server.com/webhook">
            <p class="help-text">接收 JSON 格式通知的 HTTP 端点</p>
          </div>
          <div class="action-row">
             <button class="btn-test" @click="testChannel('webhook')">🚀 测试 Webhook 通知</button>
          </div>
        </div>
      </section>

      <!-- 企业微信 -->
      <section class="config-card highlight-border" v-if="config.enable_wechat">
        <div class="card-title">企业微信机器人配置</div>
        <div class="card-body">
          <div class="form-group">
            <label>Webhook Key</label>
            <input v-model="config.wechat_key" type="text" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx">
            <p class="help-text">企业微信群机器人的 Webhook Key（URL 中 key= 后面的部分）</p>
          </div>
          <div class="action-row">
             <button class="btn-test" @click="testChannel('wechat')">🚀 测试企业微信通知</button>
          </div>
        </div>
      </section>

      <!-- Bottom Actions -->
      <div class="page-actions">
        <button class="btn-save-all" @click="saveAll">💾 保存所有配置</button>
      </div>

    </main>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const account = reactive({ username: '', password: '' })
const config = reactive({
  show_lunar: false,
  timezone: 'Asia/Shanghai',
  cron_expression: '0 0 * * *',
  // Channels
  enable_telegram: false,
  enable_bark: false,
  enable_webhook: false,
  enable_wechat: false,
  // Configs
  api_token: '',
  telegram_token: '',
  telegram_chat_id: '',
  bark_url: '',
  webhook_url: '',
  wechat_key: ''
})

onMounted(async () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  account.username = user.username || 'admin'
  await fetchSettings()
})

const fetchSettings = async () => {
  const token = localStorage.getItem('token')
  try {
    const res = await fetch('/api/settings', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (res.ok) {
      const data = await res.json()
      // Convert string booleans to real booleans if needed, though updated DB handles strings
      for (const key in data) {
         if (key.startsWith('enable_') || key === 'show_lunar') {
            config[key] = data[key] === 'true'
         } else {
            config[key] = data[key]
         }
      }
    }
  } catch (err) {
    console.error(err)
  }
}

const saveAll = async () => {
  const token = localStorage.getItem('token')
  const payload = { ...config }
  // Convert booleans to strings for simple SQLite storage
  for (const key in payload) {
    if (typeof payload[key] === 'boolean') {
      payload[key] = String(payload[key])
    }
  }
  
  try {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })
    
    if (res.ok) {
      alert('系统配置已保存！')
    } else {
      alert('保存失败')
    }
  } catch (err) {
    console.error(err)
    alert('保存出错')
  }
}

const updateAccount = () => {
  if (!account.password) {
    alert('请输入新密码')
    return
  }
  alert('密码修改功能开发中 (演示环境保护)')
}

const testChannel = async (channel) => {
  const token = localStorage.getItem('token')
  
  try {
    let url = ''
    let body = {}
    
    switch (channel) {
      case 'telegram':
        if (!config.telegram_token || !config.telegram_chat_id) return alert('请先填写 Telegram 配置')
        url = '/api/settings/test-telegram'
        body = { token: config.telegram_token, chatId: config.telegram_chat_id }
        break
      case 'bark':
        if (!config.bark_url) return alert('请先填写 Bark URL')
        url = '/api/settings/test-bark'
        body = { barkUrl: config.bark_url }
        break
      case 'webhook':
        if (!config.webhook_url) return alert('请先填写 Webhook URL')
        url = '/api/settings/test-webhook'
        body = { webhookUrl: config.webhook_url }
        break
      case 'wechat':
        if (!config.wechat_key) return alert('请先填写企业微信 Webhook Key')
        url = '/api/settings/test-wechat'
        body = { wechatKey: config.wechat_key }
        break
      default:
        alert(`${channel} 测试功能开发中`)
        return
    }
    
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(body)
    })
    const data = await res.json()
    if (data.success) {
      alert(`${channel.toUpperCase()} 消息发送成功！`)
    } else {
      alert(`发送失败：${data.error || '未知错误'}`)
    }
  } catch (e) {
    alert('测试出错：' + e.message)
  }
}

const logout = () => {
  localStorage.removeItem('token')
  router.push('/login')
}
</script>

<style scoped>
.settings-container {
  min-height: 100vh;
  background: #f8f9fa;
  padding-bottom: 50px;
}

.settings-header {
  background: white;
  padding: 0 40px;
  height: 64px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e5e7eb;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.header-left h1 {
  font-size: 20px;
  color: #111827;
  margin: 0;
}

.back-btn {
  background: none;
  font-size: 15px;
  color: #6b7280;
}

.btn-logout {
  background: none;
  color: #dc2626;
  font-size: 14px;
}

.settings-content {
  max-width: 1000px;
  margin: 30px auto;
  padding: 0 20px;
  display: grid;
  gap: 25px;
}

.config-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  overflow: hidden;
  border: 1px solid #e5e7eb;
}

.card-title {
  padding: 15px 25px;
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #f3f4f6;
  background: #fff;
}

.card-body {
  padding: 25px;
}

.highlight-border {
  border: 1px solid #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #4b5563;
}

.form-group input[type="text"],
.form-group input[type="password"],
.form-group select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  color: #1f2937;
  transition: all 0.2s;
}

.form-group input:focus,
.form-group select:focus {
  border-color: #667eea;
  outline: none;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-group input:disabled {
  background: #f9fafb;
  color: #9ca3af;
}

.help-text {
  margin: 6px 0 0;
  font-size: 12px;
  color: #9ca3af;
}

.divider {
  height: 1px;
  background: #f3f4f6;
  margin: 20px 0;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #374151;
  cursor: pointer;
}

.info-box {
  background: #eff6ff;
  border-radius: 6px;
  padding: 12px;
  margin-top: 8px;
  font-size: 13px;
  color: #1e40af;
}

.info-box p { margin: 0; }

.channels-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 15px;
}

.channel-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #374151;
  cursor: pointer;
}

.links-row {
  margin-top: 15px;
  display: flex;
  gap: 15px;
}

.links-row a {
  font-size: 13px;
  color: #667eea;
  text-decoration: none;
}

.btn-primary {
  background: #3b82f6;
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 500;
}

.btn-test {
  background: #6366f1;
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
  width: 100%;
}

.page-actions {
  text-align: right;
  margin-top: 20px;
}

.btn-save-all {
  background: #10b981;
  color: white;
  padding: 12px 30px;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2);
}

.btn-save-all:hover {
  background: #059669;
}

/* ========== 响应式适配 - 手机端 ========== */
@media (max-width: 768px) {
  .settings-header {
    padding: 0 15px;
    height: auto;
    padding-top: 12px;
    padding-bottom: 12px;
  }
  
  .header-left {
    gap: 12px;
  }
  
  .header-left h1 {
    font-size: 18px;
  }
  
  .back-btn {
    font-size: 14px;
  }
  
  .settings-content {
    margin: 15px auto;
    padding: 0 12px;
    gap: 15px;
  }
  
  .card-title {
    padding: 12px 15px;
    font-size: 15px;
  }
  
  .card-body {
    padding: 15px;
  }
  
  .form-row {
    grid-template-columns: 1fr;
    gap: 0;
  }
  
  .channels-grid {
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  
  .links-row {
    flex-direction: column;
    gap: 8px;
  }
  
  .page-actions {
    text-align: center;
    padding: 0 12px;
  }
  
  .btn-save-all {
    width: 100%;
    padding: 14px 20px;
  }
}

@media (max-width: 480px) {
  .channels-grid {
    grid-template-columns: 1fr;
  }
  
  .info-box {
    font-size: 12px;
    padding: 10px;
  }
}
</style>
