<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="close">
    <div class="modal-content">
      <div class="modal-header">
        <h2>{{ isEdit ? '编辑订阅' : '添加新订阅' }}</h2>
        <button class="close-btn" @click="close">×</button>
      </div>
      
      <form @submit.prevent="save" class="modal-body">
        <div class="form-row">
          <div class="form-group">
            <label>订阅名称 *</label>
            <input v-model="form.name" type="text" required placeholder="如 RAINWAY">
          </div>
          <div class="form-group">
            <label>订阅类型</label>
            <input v-model="form.category" type="text" placeholder="如 家宽重新部署">
          </div>
        </div>
        
        <div class="form-group">
          <label>分类标签</label>
          <input v-model="form.tags" type="text" placeholder="可输入多个标签并使用 / 分隔">
        </div>
        
        <div class="form-row checkbox-row">
          <label class="checkbox-label">
            <input type="checkbox" v-model="form.is_lunar"> 显示农历日期
          </label>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>开始日期</label>
            <input v-model="form.start_date" type="date">
          </div>
          <div class="form-group cycle-group">
            <label>周期数值 *</label>
            <div class="input-group">
              <input v-model="form.cycle_value" type="number" min="1" required>
              <select v-model="form.cycle_unit">
                <option value="day">天</option>
                <option value="month">月</option>
                <option value="year">年</option>
              </select>
            </div>
          </div>
        </div>
        
        <div class="form-group">
          <label>到期日期 *</label>
          <div class="date-input-wrapper">
            <input v-model="form.expire_date" type="date" required>
            <button type="button" class="calc-btn" @click="calculateExpireDate">📅 自动计算到期日期</button>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>提醒提前量</label>
            <div class="input-group">
              <input v-model="form.remind_days" type="number" min="0">
              <select>
                <option value="day">天</option>
              </select>
            </div>
          </div>
          <div class="form-group options-group">
            <label>选项设置</label>
            <div class="checkbox-group">
              <label><input type="checkbox" v-model="form.active"> 启用订阅</label>
              <label><input type="checkbox" v-model="form.auto_renew"> 自动续订</label>
            </div>
          </div>
        </div>
        
        <div class="form-group">
          <label>备注</label>
          <textarea v-model="form.notes" rows="3"></textarea>
        </div>
        
        <div class="modal-footer">
          <button type="button" class="btn-cancel" @click="close">取 消</button>
          <button type="submit" class="btn-save">保 存</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'

const props = defineProps({
  isOpen: Boolean,
  editData: Object
})

const emit = defineEmits(['close', 'save'])

const isEdit = ref(false)
const form = reactive({
  name: '',
  category: '',
  tags: '',
  is_lunar: false,
  start_date: new Date().toISOString().split('T')[0],
  cycle_value: 1,
  cycle_unit: 'month',
  expire_date: '',
  remind_days: 3,
  active: true,
  auto_renew: false,
  notes: ''
})

watch(() => props.isOpen, (val) => {
  if (val) {
    if (props.editData) {
      isEdit.value = true
      Object.assign(form, props.editData)
    } else {
      isEdit.value = false
      resetForm()
    }
  }
})

const resetForm = () => {
  form.name = ''
  form.category = ''
  form.tags = ''
  form.is_lunar = false
  form.start_date = new Date().toISOString().split('T')[0]
  form.cycle_value = 1
  form.cycle_unit = 'month'
  form.expire_date = ''
  form.remind_days = 3
  form.active = true
  form.auto_renew = false
  form.notes = ''
}

const calculateExpireDate = () => {
  if (!form.start_date) return
  
  const date = new Date(form.start_date)
  const value = parseInt(form.cycle_value)
  
  if (form.cycle_unit === 'day') {
    date.setDate(date.getDate() + value)
  } else if (form.cycle_unit === 'month') {
    date.setMonth(date.getMonth() + value)
  } else if (form.cycle_unit === 'year') {
    date.setFullYear(date.getFullYear() + value)
  }
  
  form.expire_date = date.toISOString().split('T')[0]
}

const close = () => {
  emit('close')
}

const save = () => {
  emit('save', { ...form })
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: var(--radius-lg);
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-lg);
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  font-size: 18px;
  color: #374151;
}

.close-btn {
  background: none;
  font-size: 24px;
  color: #9ca3af;
  padding: 0;
}

.modal-body {
  padding: 20px;
}

.form-row {
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
}

.form-group {
  flex: 1;
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  color: #6b7280;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: var(--radius-md);
  font-size: 14px;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  border-color: #667eea;
  outline: none;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.input-group {
  display: flex;
  gap: 10px;
}

.calc-btn {
  background: #667eea;
  color: white;
  padding: 8px 12px;
  border-radius: var(--radius-md);
  font-size: 13px;
  margin-top: 5px;
  width: 100%;
}

.checkbox-row {
  margin-bottom: 15px;
}

.checkbox-group {
  display: flex;
  gap: 20px;
  padding-top: 8px;
}

.modal-footer {
  padding: 20px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn-cancel {
  background: white;
  border: 1px solid #d1d5db;
  padding: 8px 16px;
  border-radius: var(--radius-md);
  color: #374151;
}

.btn-save {
  background: var(--gradient-primary);
  color: white;
  padding: 8px 16px;
  border-radius: var(--radius-md);
}
</style>
