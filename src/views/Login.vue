<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <div class="logo">📅</div>
        <h1>订阅管理系统</h1>
        <p>登录管理您的订阅提醒</p>
      </div>
      
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label>👤 用户名</label>
          <input 
            v-model="username" 
            type="text" 
            placeholder="请输入用户名" 
            required
          >
        </div>
        
        <div class="form-group">
          <label>🔒 密码</label>
          <input 
            v-model="password" 
            type="password" 
            placeholder="请输入密码" 
            required
          >
        </div>
        
        <button type="submit" :disabled="loading" class="login-btn">
          <span v-if="loading">登录中...</span>
          <span v-else>📲 登录</span>
        </button>
      </form>
      
      <div class="login-footer">
        <p v-if="error" class="error-msg">{{ error }}</p>
        <p class="hint">首次登录将自动注册</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const handleLogin = async () => {
  loading.value = true
  error.value = ''
  
  try {
    // Try login first
    let response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.value, password: password.value })
    })
    
    // If login fails, try register (for demo simplicity)
    if (response.status === 401) {
       // Check if it's a new user scenario or just wrong password
       // For this MVP, let's just show error. 
       // But to make it easy for user, let's add a register logic if user not found?
       // Actually, let's stick to the plan: Login or Register.
       // Let's try register if login fails with specific error or just provide a register button?
       // For simplicity: Auto-register if user doesn't exist is risky.
       // Let's just implement Login. The user can manually register via API or we add a register toggle.
       // Let's add a register toggle in UI later. For now, let's assume the user will register first.
       // Wait, I'll modify the logic to try register if login fails with 401 AND it's the first time?
       // Let's just add a "Register" button or auto-register logic for the very first user.
       
       // Let's try to register if login fails, assuming it might be a new user.
       const registerRes = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: username.value, password: password.value })
       })
       
       if (registerRes.ok) {
         response = registerRes
       }
    }
    
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || '登录失败')
    }
    
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    router.push('/')
    
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: var(--gradient-primary);
  padding: 20px;
}

.login-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 40px;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 400px;
  text-align: center;
}

.login-header {
  margin-bottom: 30px;
}

.logo {
  font-size: 48px;
  margin-bottom: 10px;
}

.login-header h1 {
  margin: 0;
  font-size: 24px;
  color: var(--color-bg-primary);
}

.login-header p {
  margin: 5px 0 0;
  color: var(--color-text-secondary);
}

.form-group {
  margin-bottom: 20px;
  text-align: left;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--color-bg-secondary);
}

.form-group input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e2e8f0;
  border-radius: var(--radius-md);
  font-size: 16px;
  transition: border-color 0.3s;
}

.form-group input:focus {
  border-color: #667eea;
  outline: none;
}

.login-btn {
  width: 100%;
  padding: 14px;
  background: var(--gradient-primary);
  color: white;
  font-size: 16px;
  font-weight: 600;
  border-radius: var(--radius-md);
  transition: opacity 0.3s;
}

.login-btn:hover {
  opacity: 0.9;
}

.login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.error-msg {
  color: var(--color-accent);
  margin-top: 15px;
  font-size: 14px;
}

.hint {
  margin-top: 15px;
  font-size: 12px;
  color: #9ca3af;
}
</style>
