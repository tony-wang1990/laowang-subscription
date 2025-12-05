<template>
  <div class="dashboard-container">
    <header class="dashboard-header">
      <div class="header-left">
        <div class="logo">🧭</div>
        <h1 class="rainbow-text">LaoWang Subscription</h1>
      </div>
      <div class="header-right">
        <!-- Theme Switcher -->
        <div class="theme-switcher">
          <select v-model="themeMode" @change="handleThemeChange">
            <option value="light">☀️ 浅色</option>
            <option value="dark">🌙 深色</option>
            <option value="system">🖥️ 系统</option>
          </select>
        </div>

        <div class="info-group time-group">
           <div class="date-row">
             <span class="year">{{ dateParts.year }}年</span>
             <span class="month">{{ dateParts.month }}月</span>
             <span class="day">{{ dateParts.day }}日</span>
           </div>
           <div class="weekday">{{ dateParts.weekday }}</div>
        </div>
        
        <div class="info-group weather-group">
           <div class="temp">25°C</div>
           <div class="weather">晴</div>
        </div>

        <a href="https://github.com/tony-wang1990/laowang-subscription" target="_blank" class="github-link">
           <span class="g">G</span><span class="i">i</span><span class="t">t</span><span class="h">H</span><span class="u">u</span><span class="b">b</span>
        </a>
        
        <div class="divider"></div>

        <button class="nav-btn" @click="fetchSubscriptions">
          <span>列表</span>
        </button>
        <button class="nav-btn" @click="router.push('/settings')">
          <span>设置</span>
        </button>
        <button class="btn-logout" @click="logout">
          <span>退出</span>
        </button>
      </div>
    </header>
    
    <main class="dashboard-content">
      <div class="content-header">
        <h2>订阅列表</h2>
        <p>使用搜索与分类快速定位订阅，开启农历显示可同步查看农历日期</p>
      </div>

      <div class="toolbar">
        <div class="search-wrapper">
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="🔍 搜索名称、类型或备注..."
            @input="debounceSearch"
          >
        </div>
        <div class="filter-wrapper">
          <select v-model="filterCategory" @change="fetchSubscriptions">
            <option value="all">全部分类</option>
            <option v-for="cat in categoryOptions" :key="cat" :value="cat">
              {{ cat }}
            </option>
            <option disabled>──────</option>
            <option value="custom" disabled>手动输入分类即可添加</option>
          </select>
        </div>
        <div class="toggle-wrapper">
          <label><input type="checkbox"> 显示农历</label>
        </div>
        <button class="btn-add" @click="openAddModal">＋ 添加新订阅</button>
      </div>
      
      <div class="subscription-table">
        <div class="table-header">
           <div class="th name">名称</div>
           <div class="th type">类型</div>
           <div class="th date">到期时间</div>
           <div class="th remind">提醒设置</div>
           <div class="th status">状态</div>
           <div class="th actions">操作</div>
        </div>
        
        <div v-if="loading" class="loading-state">加载中...</div>
        
        <div v-else v-for="sub in subscriptions" :key="sub.id" class="table-row">
           <!-- 名称 -->
           <div class="td name">
              <div class="main-text">{{ sub.name }}</div>
              <div class="sub-text">{{ sub.notes || '无备注' }}</div>
           </div>
           
           <!-- 类型 -->
           <div class="td type">
              <div class="category-badge">
                 <span class="icon">{{ getCategoryIcon(sub.category) }}</span>
                 {{ sub.category }}
              </div>
              <div class="cycle-info">
                 周期: {{ sub.cycle_value }}{{ getUnitText(sub.cycle_unit) }}
                 <span class="refresh-icon">🔄</span>
              </div>
              <div class="tag-info">🏷️ 公历</div>
           </div>
           
           <!-- 到期时间 -->
           <div class="td date">
              <div class="main-date">{{ formatDate(sub.expire_date) }}</div>
              <div class="lunar-date">农历: 暂无数据</div>
              <div class="days-left" :class="getDaysLeftClass(sub.daysLeft)">
                 还剩{{ sub.daysLeft }}天
              </div>
              <div class="start-date">开始: {{ formatDate(sub.created_at) }}</div>
           </div>
           
           <!-- 提醒设置 -->
           <div class="td remind">
              🔔 提前{{ sub.remind_days }}天
           </div>
           
           <!-- 状态 -->
           <div class="td status">
              <span class="status-pill" :class="sub.status === 'active' ? 'active' : 'inactive'">
                <span class="dot"></span>
                {{ sub.status === 'active' ? '正常' : '停用' }}
              </span>
           </div>
           
           <!-- 操作 (2x2 Grid) -->
           <div class="td actions">
              <div class="action-grid">
                 <button class="btn-act edit" @click="openEditModal(sub)">
                   📝 编辑
                 </button>
                 <button class="btn-act test" @click="testNotify(sub)">
                   ✈️ 测试
                 </button>
                 <button class="btn-act delete" @click="deleteSubscription(sub.id)">
                   🗑️ 删除
                 </button>
                 <button 
                    class="btn-act stop" 
                    :class="{ 'paused': sub.status !== 'active' }"
                    @click="toggleStatus(sub)"
                 >
                   {{ sub.status === 'active' ? '⏸ 停用' : '▶ 启用' }}
                 </button>
              </div>
           </div>
        </div>
      </div>
    </main>
    
    <SubscriptionModal 
      :isOpen="isModalOpen" 
      :editData="currentEdit"
      @close="closeModal"
      @save="saveSubscription"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import SubscriptionModal from '../components/SubscriptionModal.vue'

const router = useRouter()
const subscriptions = ref([])
const loading = ref(false)
const searchQuery = ref('')
const filterCategory = ref('all')
const isModalOpen = ref(false)
const currentEdit = ref(null)
const currentTime = ref('')
const dateParts = ref({ year: '', month: '', day: '', weekday: '' })

// Theme Logic
const themeMode = ref(localStorage.getItem('themeMode') || 'system')

const applyTheme = () => {
  const root = document.documentElement
  let isDark = false

  if (themeMode.value === 'system') {
    isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  } else {
    isDark = themeMode.value === 'dark'
  }

  if (isDark) {
    root.setAttribute('data-theme', 'dark')
  } else {
    root.removeAttribute('data-theme')
  }
}

const handleThemeChange = () => {
  localStorage.setItem('themeMode', themeMode.value)
  applyTheme()
}

// Watch system preference changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (themeMode.value === 'system') applyTheme()
})

// Dynamic categories with defaults
const categoryOptions = computed(() => {
  const defaults = ['VPS', '域名', '软件', '会员', '电话卡', '其他']
  const existing = subscriptions.value.map(s => s.category).filter(Boolean)
  // Merge and deduplicate
  return [...new Set([...defaults, ...existing])]
})

onMounted(() => {
  fetchSubscriptions()
  updateTime()
  setInterval(updateTime, 1000)
  applyTheme() // Init theme
})

const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
  
  dateParts.value = {
    year: now.getFullYear(),
    month: (now.getMonth() + 1).toString().padStart(2, '0'),
    day: now.getDate().toString().padStart(2, '0'),
    weekday: now.toLocaleDateString('zh-CN', { weekday: 'long', timeZone: 'Asia/Shanghai' })
  }
}

// Reuse fetch logic but simplified for brevity in this replace
const fetchSubscriptions = async () => {
  loading.value = true
  const token = localStorage.getItem('token')
  try {
     const params = new URLSearchParams()
     if (searchQuery.value) params.append('search', searchQuery.value)
     if (filterCategory.value !== 'all') params.append('category', filterCategory.value)
     
     const res = await fetch(`/api/subscriptions?${params.toString()}`, {
       headers: { 'Authorization': `Bearer ${token}` }
     })
     const data = await res.json()
     subscriptions.value = data.map(sub => ({
       ...sub,
       daysLeft: calculateDaysLeft(sub.expire_date)
     }))
  } catch (e) { console.error(e) } 
  finally { loading.value = false }
}

const calculateDaysLeft = (dateStr) => {
  const target = new Date(dateStr)
  const now = new Date()
  target.setHours(0,0,0,0)
  now.setHours(0,0,0,0)
  const diff = target - now
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

const getCategoryIcon = (cat) => {
  if (!cat) return '📦'
  if (cat.includes('宽带') || cat.includes('家宽')) return '❄️'
  if (cat.includes('电话') || cat.includes('保号')) return '📞'
  if (cat.includes('域名')) return '🌐'
  return '📦'
}

const getUnitText = (unit) => {
  const map = { day: '天', month: '月', year: '年' }
  return map[unit] || unit
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

const getDaysLeftClass = (days) => {
  if (days < 0) return 'text-red'
  if (days <= 7) return 'text-orange'
  return 'text-gray'
}

const openAddModal = () => { currentEdit.value = null; isModalOpen.value = true }
const openEditModal = (sub) => { currentEdit.value = { ...sub }; isModalOpen.value = true }
const closeModal = () => { isModalOpen.value = false; currentEdit.value = null }

const saveSubscription = async (formData) => {
  const token = localStorage.getItem('token')
  const method = currentEdit.value ? 'PUT' : 'POST'
  const url = currentEdit.value ? `/api/subscriptions/${currentEdit.value.id}` : '/api/subscriptions'
  
  await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(formData)
  })
  closeModal()
  fetchSubscriptions()
}

const deleteSubscription = async (id) => {
  if (!confirm('确认删除？')) return
  const token = localStorage.getItem('token')
  await fetch(`/api/subscriptions/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } })
  fetchSubscriptions()
}

// New Actions
const testNotify = async (sub) => {
  alert('测试通知发送中... (后端需对接)')
}

const toggleStatus = async (sub) => {
  const newStatus = sub.status === 'active' ? 'inactive' : 'active'
  const token = localStorage.getItem('token')
  const payload = { ...sub, status: newStatus }
  
  await fetch(`/api/subscriptions/${sub.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(payload)
  })
  fetchSubscriptions()
}

const logout = () => {
  localStorage.removeItem('token')
  router.push('/login')
}

let timeout
const debounceSearch = () => {
  clearTimeout(timeout)
  timeout = setTimeout(fetchSubscriptions, 300)
}
</script>

<style scoped>
.dashboard-container {
  min-height: 100vh;
  background: var(--bg-page);
  color: var(--text-main);
  transition: background-color 0.3s, color 0.3s;
}

/* Header Styles */
.dashboard-header {
  background: var(--bg-header);
  height: 70px;
  padding: 0 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
  color: var(--text-main);
  transition: background-color 0.3s, border-color 0.3s;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.logo { font-size: 28px; }

.rainbow-text {
  font-size: 24px;
  font-weight: 800;
  margin: 0;
  background: linear-gradient(to right, #4ade80, #60a5fa, #a78bfa, #f472b6);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  letter-spacing: 1px;
}

.header-right { 
  display: flex; 
  align-items: center; 
  gap: 25px; 
}

/* Theme Switcher */
.theme-switcher select {
  padding: 5px 10px;
  border-radius: 4px;
  border: 1px solid var(--border-color);
  background: var(--bg-input);
  color: var(--text-main);
  font-size: 13px;
  cursor: pointer;
}

.info-group {
  display: flex;
  flex-direction: column;
  justify-content: center;
  line-height: 1.2;
}

.time-group {
  text-align: right;
  border-right: 1px solid var(--border-color);
  padding-right: 20px;
}

.date-row {
  font-family: 'Consolas', monospace;
  font-weight: 700;
  font-size: 18px;
}
.year { color: #4ade80; }
.month { color: #38bdf8; }
.day { color: #818cf8; }

.weekday {
  font-size: 12px;
  color: #4ade80;
  text-align: left;
}

.weather-group { text-align: left; margin-right: 10px; }
.temp { font-size: 18px; font-weight: 700; color: #4ade80; }
.weather { font-size: 12px; color: #38bdf8; }

.github-link {
  text-decoration: none;
  font-weight: 800;
  font-size: 20px;
  letter-spacing: 2px;
  margin-right: 10px;
  transition: transform 0.2s;
}
.github-link:hover { transform: scale(1.05); }
.github-link .g { color: #4ade80; }
.github-link .i { color: #38bdf8; }
.github-link .t { color: #818cf8; }
.github-link .h { color: #c084fc; }
.github-link .u { color: #f472b6; }
.github-link .b { color: #fbbf24; }

.divider {
  width: 1px;
  height: 30px;
  background: var(--border-color);
}

.nav-btn, .btn-logout { 
  background: none; 
  font-size: 14px; 
  color: var(--text-sub); 
  font-weight: 500;
  padding: 5px 10px;
  border-radius: 4px;
}
.nav-btn:hover { color: var(--text-main); background: rgba(128,128,128,0.1); }
.btn-logout:hover { color: #ef4444; background: rgba(239,68,68,0.1); }

.dashboard-content { max-width: 1400px; margin: 0 auto; padding: 20px; }

.content-header { margin-bottom: 20px; }
.content-header h2 { font-size: 24px; margin: 0 0 5px 0; color: var(--text-main); }
.content-header p { margin: 0; color: var(--text-sub); font-size: 14px; }

.toolbar {
  background: var(--bg-card);
  padding: 15px 20px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 25px;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
}

.search-wrapper { flex: 1; }
.search-wrapper input {
  width: 100%;
  padding: 10px 15px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-input);
  color: var(--text-main);
}

.filter-wrapper select {
  padding: 10px 15px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  min-width: 150px;
  background: var(--bg-input);
  color: var(--text-main);
}

.toggle-wrapper {
  margin-right: 15px;
  font-size: 14px;
  color: var(--text-sub);
}

.btn-add {
  background: #6366f1;
  color: white;
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 600;
  box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.3);
}

/* Table Styles */
.subscription-table {
  background: var(--bg-card);
  border-radius: 8px;
  border: 1px solid var(--border-color);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.table-header {
  display: grid;
  grid-template-columns: 2fr 1.5fr 2fr 1.2fr 1fr 1.8fr;
  padding: 15px 20px;
  background: var(--bg-table-header);
  border-bottom: 1px solid var(--border-color);
  font-size: 13px;
  color: var(--text-sub);
  font-weight: 600;
}

.table-row {
  display: grid;
  grid-template-columns: 2fr 1.5fr 2fr 1.2fr 1fr 1.8fr;
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
  align-items: flex-start;
  transition: background 0.2s;
  color: var(--text-main);
}

.table-row:hover { background: var(--bg-hover); }

/* Column Specifics */
.td.name .main-text { font-size: 16px; font-weight: 600; color: var(--text-main); margin-bottom: 4px; }
.td.name .sub-text { font-size: 13px; color: var(--text-sub); }

.category-badge {
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--text-sub);
  font-weight: 600;
  margin-bottom: 5px;
}
.cycle-info, .tag-info { font-size: 12px; color: var(--text-sub); margin-bottom: 2px; }
.cycle-info .refresh-icon { color: #60a5fa; font-size: 10px; margin-left: 4px; }

.td.date { font-size: 14px; }
.main-date { font-weight: 600; color: var(--text-main); }
.lunar-date { color: #818cf8; font-size: 12px; margin: 2px 0; }
.days-left { font-size: 13px; margin: 2px 0; }
.text-red { color: #f87171; font-weight: 600; }
.text-orange { color: #fbbf24; }
.text-gray { color: var(--text-sub); }
.start-date { font-size: 12px; color: var(--text-sub); margin-top: 5px; }

.td.remind { display: flex; align-items: center; gap: 5px; font-weight: 600; color: var(--text-main); }

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
}
.status-pill.active { background: rgba(16, 185, 129, 0.1); color: #10b981; }
.status-pill.inactive { background: rgba(156, 163, 175, 0.1); color: #9ca3af; }
.status-pill .dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }

/* Action Grid */
.action-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.btn-act {
  border: none;
  border-radius: 4px;
  padding: 6px;
  font-size: 12px;
  color: white;
  font-weight: 500;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: opacity 0.2s;
}
.btn-act:hover { opacity: 0.9; }

.btn-act.edit { background: #8b5cf6; }
.btn-act.test { background: #3b82f6; }
.btn-act.delete { background: #ef4444; }
.btn-act.stop { background: #f59e0b; }
.btn-act.stop.paused { background: #10b981; }
</style>
