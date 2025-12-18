<template>
  <Transition name="toast">
    <div v-if="visible" :class="['toast', `toast-${type}`]">
      <!-- Иконка в зависимости от типа уведомления -->
      <div class="toast-icon">
        <span v-if="type === 'success'">✅</span>
        <span v-else-if="type === 'error'">❌</span>
        <span v-else-if="type === 'warning'">⚠️</span>
        <span v-else>ℹ️</span>
      </div>
      <!-- Контент уведомления -->
      <div class="toast-content">
        <div class="toast-title">{{ title }}</div>
        <div v-if="message" class="toast-message">{{ message }}</div>
      </div>
      <!-- Кнопка закрытия -->
      <button class="toast-close" @click="close">×</button>
    </div>
  </Transition>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// Входные параметры компонента
const props = defineProps({
  // Тип уведомления: success, error, warning, info
  type: {
    type: String,
    default: 'info',
    validator: (value) => ['success', 'error', 'warning', 'info'].includes(value)
  },
  // Заголовок уведомления
  title: {
    type: String,
    required: true
  },
  // Текст сообщения
  message: {
    type: String,
    default: ''
  },
  // Время отображения в мс
  duration: {
    type: Number,
    default: 5000
  }
})

// События, которые может генерировать компонент
const emit = defineEmits(['close'])

const visible = ref(false)
let timeoutId = null

onMounted(() => {
  // Показываем уведомление при монтировании
  visible.value = true

  // Если задана длительность, запускаем таймер скрытия
  if (props.duration > 0) {
    timeoutId = setTimeout(() => {
      close()
    }, props.duration)
  }
})

// Метод закрытия уведомления
function close() {
  visible.value = false
  if (timeoutId) {
    clearTimeout(timeoutId)
  }
  // Ждем завершения анимации перед генерацией события close
  setTimeout(() => {
    emit('close')
  }, 300)
}
</script>

<style scoped>
/* Стили уведомления */
.toast {
  position: fixed;
  top: 20px;
  right: 20px;
  background: rgba(40, 40, 40, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 16px 20px;
  min-width: 300px;
  max-width: 400px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: flex-start;
  gap: 12px;
  z-index: 10000;
  animation: slideIn 0.3s ease-out;
}

/* Цветовое кодирование типов уведомлений */
.toast-success {
  border-left: 4px solid #10b981;
}

.toast-error {
  border-left: 4px solid #ef4444;
}

.toast-warning {
  border-left: 4px solid #f59e0b;
}

.toast-info {
  border-left: 4px solid #3b82f6;
}

.toast-icon {
  font-size: 20px;
  flex-shrink: 0;
  margin-top: 2px;
}

.toast-content {
  flex: 1;
  min-width: 0;
}

.toast-title {
  font-size: 15px;
  font-weight: 600;
  color: white;
  margin-bottom: 4px;
}

.toast-message {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.4;
}

.toast-close {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.toast-close:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

/* Анимация появления */
@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Анимации перехода Vue */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.toast-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

/* Адаптивность для мобильных */
@media (max-width: 480px) {
  .toast {
    top: 10px;
    right: 10px;
    left: 10px;
    min-width: auto;
    max-width: none;
  }
}
</style>

