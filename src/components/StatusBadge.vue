<template>
  <span class="status-badge" :class="statusClass">
    <span class="dot"></span>
    {{ statusText }}
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: {
    type: String,
    default: 'active'
  },
  daysLeft: {
    type: Number,
    default: 0
  }
})

const statusClass = computed(() => {
  if (props.status === 'inactive') return 'inactive'
  if (props.daysLeft < 0) return 'expired'
  if (props.daysLeft <= 3) return 'warning'
  return 'active'
})

const statusText = computed(() => {
  if (props.status === 'inactive') return '已停用'
  if (props.daysLeft < 0) return '已过期'
  if (props.daysLeft <= 3) return '即将到期'
  return '正常'
})
</script>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.active {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.warning {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.expired {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.inactive {
  background: rgba(107, 114, 128, 0.1);
  color: #6b7280;
}
</style>
