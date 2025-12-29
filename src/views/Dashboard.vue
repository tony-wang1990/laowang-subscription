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
            <option value="space">🚀 太空</option>
            <option value="neon">💫 霓虹</option>
            <option value="candy">� 糖果</option>
            <option value="sakura">🌸 少女</option>
            <option value="ocean">🌊 海洋</option>
            <option value="cyber">🤖 科幻</option>
            <option value="cartoon">� 卡通</option>
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

           <div class="weather-row main-weather">
             <span class="temp">{{ weather.temp }}</span>
             <span class="condition">{{ weather.condition }}</span>
           </div>
        </div>

        <a href="https://github.com/tony-wang1990/laowang-subscription" target="_blank" class="github-link">
           <span class="g">G</span><span class="i">i</span><span class="t">t</span><span class="h">H</span><span class="u">u</span><span class="b">b</span>
        </a>
        
        <div class="divider"></div>

        <div class="nav-group">
          <button class="nav-btn" @click="router.push('/settings')">
            <span>设置</span>
          </button>
          <button class="btn-logout" @click="logout">
            <span>退出</span>
          </button>
        </div>
      </div>
    </header>
    
    <main class="dashboard-content">
      <div class="content-header">
        <h2>订阅列表</h2>
        <p>使用搜索与分类快速定位订阅，开启农历显示可同步查看农历日期</p>
      </div>

      <!-- 统计仪表盘 -->
      <div class="stats-dashboard">
        <div class="stat-card urgent">
          <div class="stat-icon">🔔</div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.urgentCount }}</div>
            <div class="stat-label">7天内到期</div>
          </div>
        </div>
        <div class="stat-card warning">
          <div class="stat-icon">📅</div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.monthlyCount }}</div>
            <div class="stat-label">本月到期</div>
          </div>
        </div>
        <div class="stat-card money">
          <div class="stat-icon">💰</div>
          <div class="stat-info">
            <div class="stat-value">¥{{ stats.monthlyExpense }}</div>
            <div class="stat-label">本月费用</div>
          </div>
        </div>
        <div class="stat-card total">
          <div class="stat-icon">📈</div>
          <div class="stat-info">
            <div class="stat-value">¥{{ stats.yearlyExpense }}</div>
            <div class="stat-label">年度预估</div>
          </div>
        </div>
      </div>

      <div class="toolbar">
        <!-- 服务器离线警告 -->
        <div v-if="!isServerOnline" class="server-offline-alert">
          ⚠️ 后台服务未连接，数据无法同步。请检查终端是否运行正常。
        </div>

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
          <label><input type="checkbox" v-model="showLunar"> 显示农历</label>
        </div>
        <div class="view-switch">
          <button 
            class="switch-btn" 
            :class="{ active: viewMode === 'table' }" 
            @click="viewMode = 'table'; saveViewMode()"
            title="列表视图"
          >≡</button>
          <button 
            class="switch-btn" 
            :class="{ active: viewMode === 'card' }" 
            @click="viewMode = 'card'; saveViewMode()"
            title="卡片视图"
          >⊞</button>
          <button 
            class="switch-btn" 
            :class="{ active: viewMode === 'calendar' }" 
            @click="viewMode = 'calendar'; saveViewMode()"
            title="日历视图"
          >📅</button>
        </div>
        <div class="export-wrapper">
          <button class="btn-export" @click="exportJSON">📤 导出</button>
          <button class="btn-import" @click="triggerImport">📥 导入</button>
          <input 
            type="file" 
            ref="importFileInput" 
            @change="handleImport" 
            accept=".json" 
            style="display: none"
          >
        </div>
        <button class="btn-add" @click="openAddModal">添加新订阅</button>
      </div>
      
      <div v-show="viewMode === 'table'" class="subscription-table">
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
              <div class="price-info">
                 🏷️ {{ formatPrice(sub) }}
              </div>
           </div>
           
           <!-- 到期时间 -->
           <div class="td date">
              <div v-if="showLunar" class="lunar-date">农历: {{ getLunarDate(sub.expire_date) }}</div>
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
                   编 辑
                 </button>
                 <button class="btn-act test" @click="testNotify(sub)">
                   测 试
                 </button>
                 <button class="btn-act delete" @click="deleteSubscription(sub.id)">
                   删 除
                 </button>
                 <button 
                    class="btn-act stop" 
                    :class="{ 'paused': sub.status !== 'active' }"
                    @click="toggleStatus(sub)"
                 >
                   {{ sub.status === 'active' ? '停 用' : '启 用' }}
                 </button>
              </div>
           </div>
        </div>
      </div>

      <!-- 卡片视图 -->
      <div v-show="viewMode === 'card'" class="subscription-cards">
        <div v-if="loading" class="loading-state">加载中...</div>
        <div v-else class="cards-grid">
          <div 
            v-for="sub in subscriptions" 
            :key="'card-' + sub.id" 
            class="sub-card"
            :class="{ 'card-warning': sub.daysLeft <= 7 && sub.daysLeft > 0, 'card-expired': sub.daysLeft <= 0 }"
          >
            <!-- 卡片头部 -->
            <div class="card-header">
              <div class="card-title">
                <span class="card-icon">{{ getCategoryIcon(sub.category) }}</span>
                <span class="card-name">{{ sub.name }}</span>
              </div>
              <span class="status-pill mini" :class="sub.status === 'active' ? 'active' : 'inactive'">
                {{ sub.status === 'active' ? '正常' : '停用' }}
              </span>
            </div>
            
            <!-- 卡片内容 -->
            <div class="card-body">
              <div class="card-row">
                <span class="card-label">类型</span>
                <span class="card-value">{{ sub.category }}</span>
              </div>
              <div class="card-row">
                <span class="card-label">周期</span>
                <span class="card-value">{{ sub.cycle_value }}{{ getUnitText(sub.cycle_unit) }} 🔄</span>
              </div>
              <div class="card-row">
                <span class="card-label">续费价格</span>
                <span class="card-value price">{{ formatPrice(sub) }}</span>
              </div>
              <div class="card-row highlight">
                <span class="card-label">剩余</span>
                <span class="card-value days" :class="getDaysLeftClass(sub.daysLeft)">
                  {{ sub.daysLeft }}天
                </span>
              </div>
              <div class="card-row" v-if="showLunar">
                <span class="card-label">农历</span>
                <span class="card-value lunar">{{ getLunarDate(sub.expire_date) }}</span>
              </div>
              <div class="card-row">
                <span class="card-label">提醒</span>
                <span class="card-value">提前{{ sub.remind_days }}天 🔔</span>
              </div>
              <div class="card-notes" v-if="sub.notes">
                <span class="notes-label">📝</span> {{ sub.notes }}
              </div>
            </div>
            
            <!-- 卡片操作 -->
            <div class="card-actions">
              <button class="btn-act edit" @click="openEditModal(sub)">编辑</button>
              <button class="btn-act test" @click="testNotify(sub)">测试</button>
              <button class="btn-act delete" @click="deleteSubscription(sub.id)">删除</button>
              <button 
                class="btn-act stop" 
                :class="{ 'paused': sub.status !== 'active' }"
                @click="toggleStatus(sub)"
              >
                {{ sub.status === 'active' ? '停用' : '启用' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 日历视图 -->
      <div v-show="viewMode === 'calendar'" class="calendar-view">
        <div class="calendar-header">
          <button class="cal-nav-btn" @click="changeMonth(-1)">◀</button>
          <h3 class="cal-title">{{ calendarYear }}年{{ calendarMonth + 1 }}月</h3>
          <button class="cal-nav-btn" @click="changeMonth(1)">▶</button>
          <button class="cal-today-btn" @click="goToToday">今天</button>
        </div>
        
        <div class="calendar-grid">
          <div class="cal-weekday" v-for="day in ['日', '一', '二', '三', '四', '五', '六']" :key="day">
            {{ day }}
          </div>
          
          <div 
            v-for="(day, index) in calendarDays" 
            :key="index"
            class="cal-day"
            :class="{
              'other-month': !day.isCurrentMonth,
              'today': day.isToday,
              'has-expire': day.subscriptions.length > 0,
              'has-urgent': day.subscriptions.some(s => s.daysLeft <= 3),
              'has-expired': day.subscriptions.some(s => s.daysLeft < 0)
            }"
            @click="selectedDate = day.date"
          >
            <span class="day-number">{{ day.dayNum }}</span>
            <div class="day-dots" v-if="day.subscriptions.length > 0">
              <span 
                v-for="(sub, i) in day.subscriptions.slice(0, 3)" 
                :key="i" 
                class="dot"
                :class="{ 
                  'dot-expired': sub.daysLeft < 0,
                  'dot-urgent': sub.daysLeft >= 0 && sub.daysLeft <= 3,
                  'dot-warning': sub.daysLeft > 3 && sub.daysLeft <= 7
                }"
              ></span>
              <span v-if="day.subscriptions.length > 3" class="dot-more">+{{ day.subscriptions.length - 3 }}</span>
            </div>
          </div>
        </div>
        
        <!-- 选中日期的订阅列表 -->
        <div class="calendar-detail" v-if="selectedDateSubscriptions.length > 0">
          <h4>{{ formatSelectedDate }} 到期的订阅</h4>
          <div class="detail-list">
            <div 
              v-for="sub in selectedDateSubscriptions" 
              :key="sub.id" 
              class="detail-item"
              :class="{ 'expired': sub.daysLeft < 0 }"
            >
              <span class="detail-icon">{{ getCategoryIcon(sub.category) }}</span>
              <span class="detail-name">{{ sub.name }}</span>
              <span class="detail-price">{{ formatPrice(sub) }}</span>
              <span class="detail-status" :class="sub.daysLeft < 0 ? 'text-red' : 'text-orange'">
                {{ sub.daysLeft < 0 ? `已过期${Math.abs(sub.daysLeft)}天` : `剩余${sub.daysLeft}天` }}
              </span>
            </div>
          </div>
        </div>
        <div class="calendar-detail empty" v-else-if="selectedDate">
          <p>{{ formatSelectedDate }} 没有到期的订阅</p>
        </div>
      </div>
    </main>
    
    <SubscriptionModal 
      :isOpen="isModalOpen" 
      :editData="currentEdit"
      @close="closeModal"
      @save="saveSubscription"
    />
    
    <!-- 页脚版本信息 -->
    <footer class="dashboard-footer">
      <span>LaoWang Subscription v1.5.0</span>
      <span class="separator">|</span>
      <a href="https://github.com/tony-wang1990/laowang-subscription" target="_blank">GitHub</a>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'

import SubscriptionModal from '../components/SubscriptionModal.vue'
import { Calendar } from 'lunar-javascript'

const router = useRouter()
const subscriptions = ref([])
const loading = ref(false)
const searchQuery = ref('')
const filterCategory = ref('all')

const showLunar = ref(false)
const isModalOpen = ref(false)
const currentEdit = ref(null)
const currentTime = ref('')
const dateParts = ref({ year: '', month: '', day: '', weekday: '' })
const weather = ref({ temp: '--', condition: '查询中...', location: '...' })
const isServerOnline = ref(true)

const checkServerStatus = async () => {
  try {
    const res = await fetch('/api/health')
    const contentType = res.headers.get('content-type')
    if (res.ok && contentType && contentType.includes('application/json')) {
      isServerOnline.value = true
    } else {
      isServerOnline.value = false
    }
  } catch (e) {
    isServerOnline.value = false
  }
}


// 统计数据计算
const stats = computed(() => {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  
  let urgentCount = 0      // 7天内到期
  let monthlyCount = 0     // 本月到期
  let monthlyExpense = 0   // 本月费用 (CNY)
  let yearlyExpense = 0    // 年度预估费用 (CNY)
  
  // 简单汇率转换 (粗略估计)
  const exchangeRates = {
    'CNY': 1, 'USD': 7.2, 'EUR': 7.8, 'GBP': 9.1, 'JPY': 0.048,
    'HKD': 0.92, 'TRY': 0.22, 'RUB': 0.078, 'KRW': 0.0054, 'FREE': 0
  }
  
  subscriptions.value.forEach(sub => {
    if (sub.status !== 'active') return
    
    const expireDate = new Date(sub.expire_date)
    const daysLeft = sub.daysLeft
    
    // 7天内到期
    if (daysLeft >= 0 && daysLeft <= 7) {
      urgentCount++
    }
    
    // 本月到期
    if (expireDate.getMonth() === currentMonth && expireDate.getFullYear() === currentYear) {
      monthlyCount++
    }
    
    // 费用计算
    const price = parseFloat(sub.price) || 0
    const currency = sub.currency || 'CNY'
    const rate = exchangeRates[currency] || 1
    const priceCNY = price * rate
    
    // 根据周期计算年度费用
    const cycleUnit = sub.cycle_unit || 'month'
    const cycleValue = parseInt(sub.cycle_value) || 1
    
    let annualCost = 0
    if (cycleUnit === 'day') {
      annualCost = priceCNY * (365 / cycleValue)
    } else if (cycleUnit === 'month') {
      annualCost = priceCNY * (12 / cycleValue)
    } else if (cycleUnit === 'year') {
      annualCost = priceCNY / cycleValue
    }
    
    yearlyExpense += annualCost
    
    // 本月费用：本月到期的订阅费用
    if (expireDate.getMonth() === currentMonth && expireDate.getFullYear() === currentYear) {
      monthlyExpense += priceCNY
    }
  })
  
  return {
    urgentCount,
    monthlyCount,
    monthlyExpense: monthlyExpense.toFixed(0),
    yearlyExpense: yearlyExpense.toFixed(0)
  }
})

// ========== 日历视图逻辑 ==========
const calendarMonth = ref(new Date().getMonth())
const calendarYear = ref(new Date().getFullYear())
const selectedDate = ref(null)

// 切换月份
const changeMonth = (delta) => {
  calendarMonth.value += delta
  if (calendarMonth.value > 11) {
    calendarMonth.value = 0
    calendarYear.value++
  } else if (calendarMonth.value < 0) {
    calendarMonth.value = 11
    calendarYear.value--
  }
}

// 回到今天
const goToToday = () => {
  const now = new Date()
  calendarMonth.value = now.getMonth()
  calendarYear.value = now.getFullYear()
  selectedDate.value = now.toISOString().split('T')[0]
}

// 生成日历网格数据
const calendarDays = computed(() => {
  const year = calendarYear.value
  const month = calendarMonth.value
  
  // 本月第一天和最后一天
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  
  // 本月第一天是星期几
  const startWeekday = firstDay.getDay()
  
  // 需要显示的上月天数
  const prevMonthDays = startWeekday
  const prevMonthLastDay = new Date(year, month, 0).getDate()
  
  // 今天
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  
  const days = []
  
  // 上月的天
  for (let i = prevMonthDays - 1; i >= 0; i--) {
    const dayNum = prevMonthLastDay - i
    const date = new Date(year, month - 1, dayNum)
    const dateStr = date.toISOString().split('T')[0]
    days.push({
      dayNum,
      date: dateStr,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
      subscriptions: getSubscriptionsForDate(dateStr)
    })
  }
  
  // 本月的天
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const date = new Date(year, month, i)
    const dateStr = date.toISOString().split('T')[0]
    days.push({
      dayNum: i,
      date: dateStr,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
      subscriptions: getSubscriptionsForDate(dateStr)
    })
  }
  
  // 下月的天（补齐到 42 天 = 6 行）
  const remaining = 42 - days.length
  for (let i = 1; i <= remaining; i++) {
    const date = new Date(year, month + 1, i)
    const dateStr = date.toISOString().split('T')[0]
    days.push({
      dayNum: i,
      date: dateStr,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
      subscriptions: getSubscriptionsForDate(dateStr)
    })
  }
  
  return days
})

// 获取某天到期的订阅
const getSubscriptionsForDate = (dateStr) => {
  return subscriptions.value.filter(sub => {
    return sub.expire_date === dateStr && sub.status === 'active'
  })
}

// 选中日期的订阅
const selectedDateSubscriptions = computed(() => {
  if (!selectedDate.value) return []
  return subscriptions.value.filter(sub => {
    return sub.expire_date === selectedDate.value && sub.status === 'active'
  })
})

// 格式化选中日期显示
const formatSelectedDate = computed(() => {
  if (!selectedDate.value) return ''
  const date = new Date(selectedDate.value)
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
})

// 导入导出功能
const importFileInput = ref(null)

const exportJSON = async () => {
  const token = localStorage.getItem('token')
  try {
    const res = await fetch('/api/subscriptions/export/json', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    
    // 创建下载链接
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `laowang-subscriptions-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    
    alert(`✅ 导出成功！共 ${data.count} 条订阅`)
  } catch (e) {
    alert('❌ 导出失败: ' + e.message)
  }
}

const triggerImport = () => {
  importFileInput.value?.click()
}

const handleImport = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  try {
    const text = await file.text()
    const data = JSON.parse(text)
    
    if (!data.subscriptions || !Array.isArray(data.subscriptions)) {
      throw new Error('无效的文件格式')
    }
    
    if (!confirm(`确认导入 ${data.subscriptions.length} 条订阅？\n(这将添加新订阅，不会覆盖现有数据)`)) {
      return
    }
    
    const token = localStorage.getItem('token')
    const res = await fetch('/api/subscriptions/import/json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ subscriptions: data.subscriptions })
    })
    
    const result = await res.json()
    alert(`✅ ${result.message}`)
    fetchSubscriptions()
  } catch (e) {
    alert('❌ 导入失败: ' + e.message)
  }
  
  // 清空 input 以允许重复选择同一文件
  event.target.value = ''
}

// View Mode Logic
const viewMode = ref(localStorage.getItem('viewMode') || 'table')
const saveViewMode = () => localStorage.setItem('viewMode', viewMode.value)

// Theme Logic
const themeMode = ref(localStorage.getItem('themeMode') || 'system')

const applyTheme = () => {
  const root = document.documentElement
  
  // 系统模式特殊处理
  if (themeMode.value === 'system') {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    if (isDark) {
      root.setAttribute('data-theme', 'dark')
    } else {
      root.removeAttribute('data-theme')
    }
    return
  }
  
  // 浅色主题移除 data-theme 属性
  if (themeMode.value === 'light') {
    root.removeAttribute('data-theme')
    return
  }
  
  // 其他主题直接设置
  root.setAttribute('data-theme', themeMode.value)
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
  fetchWeather()
  checkServerStatus()
  setInterval(updateTime, 1000)
  setInterval(fetchWeather, 600000) // 每10分钟更新天气
  setInterval(checkServerStatus, 5000) // 每5秒检查服务器状态
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



// 获取天气信息 (优先 wttr.in 获取实时温度，失败后降级到 vvhan)
const fetchWeather = async () => {
  try {
    // 1. 尝试 wttr.in (支持实时温度和访问者IP)
    const res = await fetch('https://wttr.in/?format=j1&lang=zh-cn')
    if (res.ok) {
      const data = await res.json()
      const current = data.current_condition[0]
      let condition = current.weatherDesc[0].value
      if (current.lang_zh && current.lang_zh[0]) {
          condition = current.lang_zh[0].value
      }
      weather.value = {
        temp: `${current.temp_C}°C`,
        condition: condition,
        location: '本地'
      }
      return
    }
    throw new Error('Wttr.in failed')
  } catch (e) {
    console.warn('Wttr.in fetch failed, switching to backup:', e)
    
    // 2. 降级尝试 vvhan (国内稳定源，仅提供高低温)
    try {
      const res = await fetch('https://api.vvhan.com/api/weather')
      const data = await res.json()
      if (data.success && data.info) {
        weather.value = {
          // 显示当前天气类型和最高温作为参考
          temp: data.info.high.replace('°C', '') + '°C', 
          condition: data.info.type,
          location: data.city || '本地' 
        }
        return
      }
    } catch (err) {
      console.error('All weather sources failed', err)
      weather.value = { temp: '--', condition: '离线', location: '未知' }
    }
  }
}

const getLunarDate = (dateStr) => {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    const lunar = Calendar.fromDate(d)
    return `${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`
  } catch (e) {
    return '转换失败'
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

const formatPrice = (sub) => {
  if (sub.currency === 'FREE' || !sub.price) return '免费'
  // 格式: 10 USD
  return `${sub.price} ${sub.currency || 'CNY'}`
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
  if (!isServerOnline.value) {
    alert('❌ 后台服务未连接，无法保存。请先启动服务器。')
    return
  }

  const token = localStorage.getItem('token')
  const method = currentEdit.value ? 'PUT' : 'POST'
  const url = currentEdit.value ? `/api/subscriptions/${currentEdit.value.id}` : '/api/subscriptions'
  
  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(formData)
    })
    
    if (!res.ok) {
      const errData = await res.json()
      throw new Error(errData.error || '保存失败')
    }
    
    closeModal()
    fetchSubscriptions()
  } catch (e) {
    alert('❌ 保存出错: ' + e.message)
    console.error(e)
  }
}

const deleteSubscription = async (id) => {
  console.log('删除按钮被点击, ID:', id)
  
  try {
    const token = localStorage.getItem('token')
    const res = await fetch(`/api/subscriptions/${id}`, { 
      method: 'DELETE', 
      headers: { 'Authorization': `Bearer ${token}` } 
    })
    console.log('删除请求完成, 状态:', res.status)
    if (res.ok) {
      // 直接从本地数据中移除
      subscriptions.value = subscriptions.value.filter(s => s.id !== id)
      console.log('删除成功')
    } else {
      alert('删除失败，请重试')
    }
  } catch (e) {
    console.error('删除失败:', e)
    alert('删除失败: ' + e.message)
  }
}

// New Actions
const testNotify = async (sub) => {
  const token = localStorage.getItem('token')
  if (!window.confirm(`确认要发送测试通知给 "${sub.name}" 吗？`)) return

  try {
    const res = await fetch(`/api/subscriptions/${sub.id}/test`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    if (data.success) {
      alert('✅ 测试通知已发送！请检查您的接收渠道。')
    } else {
      alert('❌ 发送失败: ' + (data.error || '未知错误'))
    }
  } catch (e) {
    alert('❌ 发送失败: 网络或服务器错误')
  }
}

const toggleStatus = async (sub) => {
  const newStatus = sub.status === 'active' ? 'inactive' : 'active'
  const token = localStorage.getItem('token')
  const payload = { ...sub, status: newStatus }
  
  try {
    const res = await fetch(`/api/subscriptions/${sub.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(payload)
    })
    if (res.ok) {
      // 直接更新本地数据状态，不重新加载整个列表
      const index = subscriptions.value.findIndex(s => s.id === sub.id)
      if (index !== -1) {
        subscriptions.value[index].status = newStatus
      }
    }
  } catch (e) {
    alert('操作失败: ' + e.message)
  }
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
  position: sticky;
  top: 0;
  z-index: 100;
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

.weather-group { 
  text-align: right; 
  margin-right: 15px; 
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-end;
}
.weather-row { display: flex; align-items: center; gap: 6px; }
.main-weather { gap: 8px; }

.temp { font-size: 19px; font-weight: 700; color: #4ade80; line-height: 1; }
.condition { font-size: 14px; color: #38bdf8; font-weight: 600; }
.user-location { font-size: 12px; color: #a78bfa; margin-top: 3px; font-weight: 500; }
.location-icon { font-size: 10px; }

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

.nav-group {
  display: flex;
  align-items: center;
  gap: 5px;
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

/* 统计仪表盘样式 */
.stats-dashboard {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  margin-bottom: 20px;
}

.stat-card {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.stat-icon {
  font-size: 36px;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: rgba(99, 102, 241, 0.1);
}

.stat-card.urgent .stat-icon { background: rgba(239, 68, 68, 0.15); }
.stat-card.warning .stat-icon { background: rgba(245, 158, 11, 0.15); }
.stat-card.money .stat-icon { background: rgba(34, 197, 94, 0.15); }
.stat-card.total .stat-icon { background: rgba(99, 102, 241, 0.15); }

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-main);
  line-height: 1.2;
}

.stat-card.urgent .stat-value { color: var(--color-danger); }
.stat-card.warning .stat-value { color: var(--color-warning); }
.stat-card.money .stat-value { color: var(--color-success); }
.stat-card.total .stat-value { color: var(--color-primary); }

.stat-label {
  font-size: 13px;
  color: var(--text-sub);
  margin-top: 4px;
}

@media (max-width: 1024px) {
  .stats-dashboard {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .stats-dashboard {
    grid-template-columns: 1fr;
  }
  
  .stat-card {
    padding: 15px;
  }
  
  .stat-icon {
    font-size: 28px;
    width: 50px;
    height: 50px;
  }
  
  .stat-value {
    font-size: 22px;
  }
}

.toolbar {
  background: var(--bg-card);
  padding: 15px 20px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 0;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
  position: sticky;
  top: 70px;
  z-index: 90;
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

/* 导入导出按钮 */
.export-wrapper {
  display: flex;
  gap: 8px;
}

.btn-export, .btn-import {
  padding: 8px 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-export {
  background: #10b981;
  color: white;
}

.btn-export:hover {
  background: #059669;
}

.btn-import {
  background: #f59e0b;
  color: white;
}

.btn-import:hover {
  background: #d97706;
}

/* Table Styles */
.subscription-table {
  background: var(--bg-card);
  border-radius: 8px;
  margin-top: 20px;
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
.price-info { font-size: 12px; color: #10b981; font-weight: 600; margin-top: 4px; }

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

/* View Switch Buttons */
.view-switch {
  display: flex;
  gap: 4px;
  background: var(--bg-input);
  border-radius: 6px;
  padding: 3px;
  border: 1px solid var(--border-color);
}

.switch-btn {
  background: transparent;
  border: none;
  padding: 6px 10px;
  font-size: 16px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
  opacity: 0.5;
}

.switch-btn:hover {
  opacity: 0.8;
}

.switch-btn.active {
  background: var(--bg-card);
  opacity: 1;
  box-shadow: var(--shadow-sm);
}

/* Card View Styles */
.subscription-cards {
  background: var(--bg-card);
  border-radius: 8px;
  border: 1px solid var(--border-color);
  padding: 20px;
  box-shadow: var(--shadow-sm);
  margin-top: 20px;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.sub-card {
  background: var(--bg-page);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  min-height: 280px;
}

.sub-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  border-color: #6366f1;
}

.sub-card.card-warning {
  border-left: 4px solid #fbbf24;
}

.sub-card.card-expired {
  border-left: 4px solid #ef4444;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.05));
  border-bottom: 1px solid var(--border-color);
}

.card-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.card-icon {
  font-size: 24px;
}

.card-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-main);
}

.status-pill.mini {
  padding: 3px 10px;
  font-size: 11px;
}

.card-body {
  padding: 16px;
  flex-grow: 1;
}

.card-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px dashed var(--border-color);
}

.card-row:last-of-type {
  border-bottom: none;
}

.card-row.highlight {
  background: transparent;
  margin: 0;
  padding: 8px 0;
  border-radius: 0;
  border-bottom: 1px dashed var(--border-color);
}

.card-label {
  font-size: 13px;
  color: var(--text-sub);
  font-weight: 500;
  text-align: left;
  width: 70px;
  flex-shrink: 0;
}

.card-value {
  font-size: 14px;
  color: var(--text-main);
  font-weight: 600;
  text-align: right;
  flex: 1;
}

.card-value.price {
  color: #10b981;
}

.card-value.days {
  font-size: 14px;
  font-weight: 600;
}

.card-value.lunar {
  color: #818cf8;
}

.card-notes {
  margin-top: 12px;
  padding: 10px;
  background: var(--bg-hover);
  border-radius: 6px;
  font-size: 13px;
  color: var(--text-sub);
}

.notes-label {
  margin-right: 4px;
}

.card-actions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  padding: 12px 16px;
  background: var(--bg-table-header);
  border-top: 1px solid var(--border-color);
  position: relative;
  z-index: 10;
}

.card-actions .btn-act {
  padding: 8px 4px;
  font-size: 11px;
  position: relative;
  z-index: 11;
  pointer-events: auto;
}

/* ========== 响应式适配 - 平板端 ========== */
@media (max-width: 1024px) {
  .dashboard-header {
    padding: 0 20px;
  }
  
  .header-right {
    gap: 15px;
  }
  
  .info-group.time-group {
    border-right: none;
    padding-right: 0;
  }
  
  .date-row {
    font-size: 14px;
  }
  
  .temp {
    font-size: 14px;
  }
  
  .table-header, .table-row {
    grid-template-columns: 2fr 1.5fr 2fr 1fr 1.5fr;
  }
  
  .th.remind, .td.remind {
    display: none;
  }
  
  /* 平板端卡片视图适配 */
  .cards-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
  
  .sub-card {
    min-height: 260px;
  }
  
  .card-name {
    font-size: 15px;
  }
  
  .card-label, .card-value {
    font-size: 12px;
  }
}

/* ========== 响应式适配 - 手机端 ========== */
@media (max-width: 768px) {
  .dashboard-header {
    padding: 12px 15px;
    height: auto;
    flex-direction: column;
    gap: 10px;
  }
  
  .header-left {
    width: 100%;
    justify-content: center;
  }
  
  .logo {
    font-size: 24px;
  }
  
  .rainbow-text {
    font-size: 18px;
  }
  
  .header-right {
    width: 100%;
    justify-content: center;
    flex-wrap: wrap;
    gap: 10px;
  }
  
  /* 移动端日期天气样式 - 合并为一行显示 */
  .info-group.time-group {
    flex-direction: row;
    align-items: center;
    gap: 8px;
    border-right: none;
    padding-right: 0;
    background: var(--bg-hover);
    padding: 0 12px;
    border-radius: 20px;
    height: 32px;
  }
  
  .date-row {
    font-size: 13px;
  }
  
  .weekday {
    display: none;
  }
  
  .info-group.weather-group {
    flex-direction: row;
    align-items: center;
    gap: 8px;
    background: var(--bg-hover);
    padding: 0 12px;
    border-radius: 20px;
    margin-right: 0;
    height: 32px;
  }
  
  .user-location {
    font-size: 12px;
    margin-top: 0;
    padding-right: 8px;
    border-right: 1px solid var(--text-sub);
    max-width: 60px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .location-icon { display: none; }

  .temp {
    font-size: 13px;
  }
  
  .condition {
    font-size: 12px;
  }
  
  .theme-switcher select {
    padding: 0 12px;
    font-size: 12px;
    height: 32px;
    border-radius: 20px;
    background: var(--bg-hover);
    border: none;
  }
  
  .github-link {
    display: none;
  }
  
  .divider {
    display: none;
  }
  
  .nav-group {
    display: flex;
    align-items: center;
    gap: 5px;
    background: var(--bg-hover);
    padding: 0 8px;
    border-radius: 20px;
    height: 32px;
  }
  
  .nav-btn, .btn-logout {
    font-size: 12px;
    padding: 4px 10px;
    background: transparent;
    border-radius: 16px;
  }
  
  .nav-btn:hover, .btn-logout:hover {
    background: rgba(128,128,128,0.15);
  }
  
  /* 内容区域 */
  .dashboard-content {
    padding: 15px;
  }
  
  .content-header h2 {
    font-size: 20px;
  }
  
  .content-header p {
    font-size: 12px;
  }
  
  /* 工具栏 */
  .toolbar {
    flex-direction: column;
    padding: 12px;
    gap: 10px;
  }
  
  .search-wrapper {
    width: 100%;
  }
  
  .filter-wrapper {
    width: 100%;
  }
  
  .filter-wrapper select {
    width: 100%;
  }
  
  .toggle-wrapper {
    width: 100%;
    margin-right: 0;
  }
  
  .btn-add {
    width: 100%;
    text-align: center;
  }
  
  .view-switch {
    width: 100%;
    justify-content: center;
  }
  
  /* 卡片视图移动端适配 */
  .subscription-cards {
    padding: 12px;
  }
  
  .cards-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .card-actions {
    grid-template-columns: repeat(2, 1fr);
  }
  
  /* 表格改卡片布局 */
  .table-header {
    display: none;
  }
  
  .table-row {
    display: flex;
    flex-direction: column;
    padding: 15px;
    gap: 12px;
    border-bottom: 1px solid var(--border-color);
    position: relative;
  }
  
  .td {
    width: 100%;
  }
  
  .td.name {
    border-bottom: 1px dashed var(--border-color);
    padding-bottom: 10px;
  }
  
  .td.name .main-text {
    font-size: 18px;
  }
  
  .td.type {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }
  
  .td.type .category-badge {
    margin-bottom: 0;
  }
  
  .td.type .cycle-info,
  .td.type .tag-info {
    margin-bottom: 0;
  }
  
  .td.date {
    background: var(--bg-hover);
    padding: 10px;
    border-radius: 8px;
  }
  
  .td.remind {
    display: none;
  }
  
  .td.status {
    position: absolute;
    top: 15px;
    right: 15px;
    width: auto;
  }
  
  .td.actions {
    border-top: 1px dashed var(--border-color);
    padding-top: 12px;
  }
  
  .action-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
  }
  
  .btn-act {
    padding: 8px 4px;
    font-size: 11px;
  }
}

/* ========== 响应式适配 - 小屏手机 ========== */
@media (max-width: 480px) {
  .rainbow-text {
    font-size: 16px;
  }
  
  .header-right {
    gap: 6px;
  }
  
  .nav-btn, .btn-logout {
    font-size: 12px;
    padding: 5px 10px;
  }
  
  .action-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  /* 小屏手机卡片视图适配 */
  .sub-card {
    min-height: 240px;
  }
  
  .card-header {
    padding: 12px;
  }
  
  .card-icon {
    font-size: 20px;
  }
  
  .card-name {
    font-size: 14px;
  }
  
  .card-body {
    padding: 12px;
  }
  
  .card-row {
    padding: 6px 0;
  }
  
  .card-row.highlight {
    padding: 8px 10px;
    min-height: 38px;
  }
  
  .card-label {
    font-size: 11px;
  }
  
  .card-value {
    font-size: 12px;
  }
  
  .card-value.days {
    font-size: 16px;
  }
  
  .card-actions {
    padding: 10px 12px;
  }
  
  .card-actions .btn-act {
    padding: 6px 2px;
    font-size: 10px;
  }
}

/* 页脚样式 */
.dashboard-footer {
  text-align: center;
  padding: 20px;
  margin-top: 30px;
  border-top: 1px solid var(--border-color);
  font-size: 13px;
  color: var(--text-sub);
}

.dashboard-footer a {
  color: var(--text-main);
  text-decoration: none;
}

.dashboard-footer a:hover {
  text-decoration: underline;
}

.dashboard-footer .separator {
  margin: 0 10px;
  opacity: 0.5;
}

/* ========== 日历视图样式 ========== */
.calendar-view {
  background: var(--bg-card);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  padding: 20px;
  margin-top: 20px;
}

.calendar-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
}

.cal-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-main);
  margin: 0;
}

.cal-nav-btn {
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  color: var(--text-main);
  width: 36px;
  height: 36px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.cal-nav-btn:hover {
  background: var(--bg-table-header);
}

.cal-today-btn {
  background: var(--color-primary);
  color: var(--text-inverse);
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  margin-left: auto;
  transition: all 0.2s;
}

.cal-today-btn:hover {
  opacity: 0.85;
  transform: translateY(-1px);
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.cal-weekday {
  text-align: center;
  padding: 10px;
  font-weight: 600;
  color: var(--text-sub);
  font-size: 13px;
}

.cal-day {
  aspect-ratio: 1;
  min-height: 70px;
  padding: 8px;
  background: var(--bg-input);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  position: relative;
}

.cal-day:hover {
  background: var(--bg-table-header);
  transform: scale(1.02);
}

.cal-day.other-month {
  opacity: 0.4;
}

.cal-day.today {
  background: var(--color-primary);
  color: var(--text-inverse);
  box-shadow: var(--shadow-md);
}

.cal-day.today .day-number {
  color: var(--text-inverse);
}

.cal-day.has-expire {
  border: 2px solid var(--color-warning);
}

.cal-day.has-urgent {
  border: 2px solid var(--color-danger);
}

.cal-day.has-expired {
  background: rgba(239, 68, 68, 0.1);
  border: 2px solid var(--color-danger);
}

.day-number {
  font-weight: 600;
  font-size: 14px;
  color: var(--text-main);
}

.day-dots {
  display: flex;
  gap: 3px;
  margin-top: auto;
  flex-wrap: wrap;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-success);
}

.dot-expired {
  background: var(--color-danger);
}

.dot-urgent {
  background: var(--color-warning);
}

.dot-warning {
  background: #eab308; /* 黄色作为警告色保留或定义新变量，暂保留或用 warning */
}

.dot-more {
  font-size: 10px;
  color: var(--text-sub);
}

/* 日历详情面板 */
.calendar-detail {
  margin-top: 20px;
  padding: 20px;
  background: var(--bg-input);
  border-radius: 8px;
}

.calendar-detail h4 {
  margin: 0 0 15px 0;
  font-size: 16px;
  color: var(--text-main);
}

.calendar-detail.empty {
  text-align: center;
  color: var(--text-sub);
}

.calendar-detail.empty p {
  margin: 0;
}

.detail-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--bg-card);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.detail-item.expired {
  border-color: var(--color-danger);
  background: rgba(239, 68, 68, 0.05); /* 背景色保持半透明，使用 RGB 值较难通过变量直接替换，除非定义 RGB 变量 */
}

.detail-icon {
  font-size: 20px;
}

.detail-name {
  flex: 1;
  font-weight: 500;
  color: var(--text-main);
}

.detail-price {
  color: var(--color-success);
  font-weight: 600;
}

.detail-status {
  font-size: 13px;
  font-weight: 500;
}

/* 服务器离线警告 */
.server-offline-alert {
  background: var(--color-danger);
  color: white;
  padding: 10px 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  box-shadow: var(--shadow-md);
  animation: pulse-alert 2s infinite;
}

@keyframes pulse-alert {
  0% { opacity: 1; }
  50% { opacity: 0.85; }
  100% { opacity: 1; }
}


.text-red { color: var(--color-danger); }
.text-orange { color: var(--color-warning); }

/* ========== 日历响应式布局 ========== */

/* 平板适配 (768px - 1024px) */
@media (max-width: 1024px) {
  .calendar-header {
    flex-wrap: wrap;
    gap: 10px;
  }
  
  .cal-today-btn {
    order: -1;
    width: 100%;
    text-align: center;
  }
  
  .cal-day {
    min-height: 60px;
  }
}

/* 手机适配 (< 768px) */
@media (max-width: 768px) {
  .calendar-view {
    padding: 15px;
    margin-top: 15px;
    border-radius: var(--radius-md);
  }
  
  .calendar-header {
    margin-bottom: 15px;
  }
  
  .cal-title {
    font-size: 18px;
  }
  
  .cal-nav-btn {
    width: 32px;
    height: 32px;
  }
  
  .cal-today-btn {
    padding: 6px 12px;
    font-size: 12px;
    width: auto;
    order: 0;
  }
  
  .calendar-grid {
    gap: 2px;
  }
  
  .cal-weekday {
    padding: 8px 4px;
    font-size: 11px;
  }
  
  .cal-day {
    min-height: 45px;
    padding: 4px;
    border-radius: 6px;
  }
  
  .day-number {
    font-size: 12px;
  }
  
  .day-dots {
    gap: 2px;
  }
  
  .dot {
    width: 5px;
    height: 5px;
  }
  
  .dot-more {
    font-size: 8px;
  }
  
  .calendar-detail {
    padding: 15px;
    margin-top: 15px;
  }
  
  .calendar-detail h4 {
    font-size: 14px;
    margin-bottom: 10px;
  }
  
  .detail-item {
    padding: 10px;
    gap: 8px;
    flex-wrap: wrap;
  }
  
  .detail-icon {
    font-size: 18px;
  }
  
  .detail-name {
    flex: none;
    width: calc(100% - 30px);
    font-size: 14px;
  }
  
  .detail-price,
  .detail-status {
    font-size: 12px;
  }
}

/* 超小屏幕适配 (< 480px) */
@media (max-width: 480px) {
  .cal-day {
    min-height: 38px;
    padding: 3px;
  }
  
  .day-number {
    font-size: 11px;
  }
  
  .dot {
    width: 4px;
    height: 4px;
  }
}
</style>
