<template>
  <div class="main-container">
    <!-- Уведомления -->
    <div class="notifications-container">
      <ToastNotification
        v-for="notification in notifications"
        :key="notification.id"
        :type="notification.type"
        :title="notification.title"
        :message="notification.message"
        :duration="notification.duration"
        @close="removeNotification(notification.id)"
      />
    </div>
    
    <div class="content-wrapper">
      <div class="center-container">
        <!-- Логотип -->
        <div class="logo-container">
          <img src="/IMG_4572.WEBP" alt="Logo" class="logo-image" />
          <h1 class="logo-title">Vertex</h1>
          <p class="logo-subtitle">Безопасный обмен валюты</p>
        </div>

        <!-- Курс доллара -->
        <div v-if="!showApplicationForm" class="exchange-container">
          <div class="exchange-card">
            <div class="exchange-header">
              <img :src="usdtIcon" alt="USDT" class="currency-flag" />
              <h2>USDT/RUB</h2>
              <div class="connection-status" :class="connectionStatusClass">
                {{ connectionStatusIcon }}
              </div>
            </div>

            <!-- Состояние загрузки -->
            <div v-if="loading" class="loading-state">
              <div class="spinner"></div>
              <p>Получение актуального курса...</p>
            </div>

            <!-- Состояние ошибки -->
            <div v-else-if="apiError" class="error-state">
              <div class="error-icon">⚠️</div>
              <h3>Курс временно недоступен</h3>
              <p class="error-message">{{ errorMessage }}</p>
              <p class="error-details">Попробуйте обновить страницу или обратиться в поддержку</p>
              <button class="retry-btn" @click="retryFetch">
                <span class="retry-icon">🔄</span>
                Повторить попытку
              </button>
            </div>

            <!-- Основной контент курса -->
            <div v-else-if="hasData" class="rates-content">
              <div class="exchange-rates">
                <div class="rate-block buy">
                  <div class="rate-label">Курс на Rapira</div>
                  <div class="rate-value">{{ formatPrice(exchangeRate.bidPrice) }} ₽</div>
                  <div class="rate-change" :class="getChangeClass(exchangeRate.chg)">
                    {{ formatPercentage(exchangeRate.chg) }}
                  </div>
                </div>

                <div class="rate-block sell">
                  <div class="rate-label">Наш курс</div>
                  <div class="rate-value">{{ formatPrice(exchangeRate.bidPrice * 1.055) }} ₽</div>
                  <div class="rate-change" :class="getChangeClass(exchangeRate.chg)">
                    {{ formatPercentage(exchangeRate.chg) }}
                  </div>
                </div>
              </div>

              <div class="rate-info">
                <div class="info-item">
                  <span class="info-label">Обновление:</span>
                  <!-- <span class="info-value">{{ formattedLastUpdateTime }}</span> -->
                  <span class="info-value">каждые 30 секунд</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Изменение за 24ч:</span>
                  <span class="info-value" :class="getChangeClass(exchangeRate.change)">
                    {{ formatChange(exchangeRate.change) }} ₽
                  </span>
                </div>
                <div class="info-item full-width">
                  <span class="info-label">Лимит:</span>
                  <span class="info-value">200,000 RUB за сделку</span>
                </div>
                <div class="info-item full-width status-info">
                  <span class="info-label">Статус:</span>
                  <span class="info-value">{{ statusMessage }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- Форма заявки (показывается при нажатии кнопки) -->
        <div v-if="showApplicationForm" class="application-form">
          <div class="form-card">
            <div class="form-header">
              <h2>📝 Форма заявки</h2>
              <p class="form-subtitle">Заполните данные для обмена валюты</p>
            </div>

            <div class="form-content">
              <!-- Информация о курсе -->
              <div class="rate-summary">
                <div class="rate-summary-item">
                  <span class="rate-label">Текущий курс:</span>
                  <span class="rate-value">{{ formatPrice(exchangeRate.askPrice) }} ₽ за 1 USDT</span>
                </div>
                <div class="rate-summary-item">
                  <span class="rate-label">Ваш бонус к сумме:</span>
                  <span class="rate-value">+5,5 %</span>
                </div>
              </div>

              <!-- Поля формы -->
              <form @submit.prevent="submitApplication" class="form-fields">
                <div class="form-group">
                  <label for="name">Ваше имя и фамилия*</label>
                  <input
                    type="text"
                    id="name"
                    v-model="formData.name"
                    required
                    placeholder="Иван Иванов"
                    class="form-input"
                    :class="{ 'form-input-error': formErrors.name }"
                    @input="formErrors.name = null"
                  />
                  <span v-if="formErrors.name" class="form-error">{{ formErrors.name }}</span>
                </div>

                <!-- <div class="form-group">
                  <label for="email">Email *</label>
                  <input
                    type="email"
                    id="email"
                    v-model="formData.email"
                    required
                    placeholder="example@mail.ru"
                    class="form-input"
                  />
                </div> -->

                <div class="form-group">
                  <label for="phone">Телефон для перевода по СБП*</label>
                  <input
                    type="tel"
                    id="phone"
                    :value="formData.phone"
                    required
                    placeholder="+7 (999) 123-45-67"
                    class="form-input"
                    :class="{ 'form-input-error': formErrors.phone }"
                    @input="handlePhoneInput"
                  />
                  <span v-if="formErrors.phone" class="form-error">{{ formErrors.phone }}</span>
                </div>

                <div class="form-group">
                  <label for="amount">Сумма в USDT *</label>
                  <div class="amount-input-group">
                    <input
                      type="text"
                      id="amount"
                      :value="formData.amount ? formatAmount(formData.amount) : ''"
                      required
                      placeholder="100"
                      class="form-input"
                      :class="{ 'form-input-error': formErrors.amount }"
                      @input="handleAmountInput"
                    />
                    <span class="amount-currency">USDT</span>
                  </div>
                  <div class="amount-hint">
                    Минимум: 1 USDT, Максимум: 10,000 USDT
                  </div>
                  <span v-if="formErrors.amount" class="form-error">{{ formErrors.amount }}</span>
                </div>

                <div class="form-group">
                  <label>Сумма к получению:</label>
                  <div class="total-amount">
                    <span class="total-value">{{ formatPrice(totalAmount) }}</span>
                    <span class="total-currency">RUB</span>
                  </div>
                  <div class="calculation-hint">
                    {{ formData.amount || 0 }} USDT × {{ formatPrice(exchangeRate.askPrice) }} ₽ + 5,5 %
                  </div>
                </div>

                <div class="form-group">
                  <label for="paymentMethod">Способ оплаты *</label>
                  <select
                    id="paymentMethod"
                    v-model="formData.paymentMethod"
                    required
                    class="form-input"
                    :class="{ 'form-input-error': formErrors.paymentMethod }"
                    @change="formErrors.paymentMethod = null"
                  >
                    <option value="" disabled>Выберите способ оплаты</option>
                    <option value="bank_card">Банковская карта</option>
                    <option value="sberbank">СПБ</option>
                  </select>
                  <span v-if="formErrors.paymentMethod" class="form-error">{{ formErrors.paymentMethod }}</span>
                </div>

                <div class="form-group">
                  <label for="comment">Комментарий (необязательно)</label>
                  <textarea
                    id="comment"
                    v-model="formData.comment"
                    placeholder="Дополнительная информация..."
                    class="form-textarea"
                    rows="3"
                  ></textarea>
                </div>

                <div class="form-agreement">
                  <input
                    type="checkbox"
                    id="agreement"
                    v-model="formData.agreement"
                    required
                    class="agreement-checkbox"
                    :class="{ 'agreement-checkbox-error': formErrors.agreement }"
                    @change="formErrors.agreement = null"
                  />
                  <label for="agreement" class="agreement-label" :class="{ 'agreement-label-error': formErrors.agreement }">
                    Я согласен с условиями обработки персональных данных
                  </label>
                </div>
                <span v-if="formErrors.agreement" class="form-error">{{ formErrors.agreement }}</span>

                <button
                  type="submit"
                  class="submit-form-btn"
                  :disabled="formSubmitting || !hasData"
                >
                  <span v-if="formSubmitting" class="btn-spinner"></span>
                  <span v-else class="btn-icon">✅</span>
                  {{ formSubmitting ? 'Отправка...' : 'Отправить заявку' }}
                </button>
              </form>
            </div>
          </div>
        </div>
        <!-- Кнопка вернутся -->
        <button v-if="showApplicationForm" class="submit-btn" @click="showApplicationForm = false">
          На главную
        </button>
        <!-- Кнопка заявки -->
        <button
          v-if="!showApplicationForm"
          class="submit-btn"
          @click="openApplicationForm"
          :disabled="loading || apiError || !hasData"
          :class="{ 'disabled': loading || apiError || !hasData }"
        >
          <span class="btn-icon"></span>
          {{ getButtonText }}
          <span class="btn-arrow"></span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { validateForm } from '../utils/validation.js'
import { formatPhone, formatAmount, parseAmount } from '../utils/format.js'
import ToastNotification from './ToastNotification.vue'
import { useTelegram } from '../composables/useTelegram.js'
import usdtIcon from './icons/usdt.svg'

// Telegram Web App
const {
  isTelegram,
  user: telegramUser,
  sendDataToBot,
  showMainButton,
  hideMainButton,
  showBackButton,
  hideBackButton
} = useTelegram()

const showApplicationForm = ref(false)

// Состояния
const loading = ref(true)
const apiError = ref(false)
const errorMessage = ref('')
const lastSuccessfulFetchTime = ref(null)

// Данные курса
const exchangeRate = ref({
  bidPrice: null,
  askPrice: null,
  chg: null,
  change: null,
})

// Данные формы
const formData = ref({
  name: '',
  email: '',
  phone: '',
  amount: null,
  paymentMethod: '',
  comment: '',
  agreement: false
})

// Ошибки валидации
const formErrors = ref({})

// Состояние уведомлений
const notifications = ref([])

const formSubmitting = ref(false)
const totalAmount = ref(0)

// API эндпоинты
// Автоматическое определение базового URL
const getApiBaseUrl = () => {
  // В production используем текущий домен (тот же, где загружен Frontend)
  if (import.meta.env.PROD) {
    return window.location.origin
  }
  // В development используем переменную окружения или localhost
  return import.meta.env.VITE_API_URL || 'http://localhost:3000'
}

const API_BASE_URL = getApiBaseUrl()
const API_URL = `${API_BASE_URL}/api/rates`
const API_ORDERS_URL = `${API_BASE_URL}/api/orders`
const API_TELEGRAM_URL = `${API_BASE_URL}/api/telegram/send`
const UPDATE_INTERVAL = 30000

// Computed свойства
const connectionStatusClass = computed(() => {
  if (loading.value) return 'loading'
  if (apiError.value) return 'error'
  if (hasData.value) return 'connected'
  return 'disconnected'
})

const connectionStatusIcon = computed(() => {
  if (loading.value) return '⟳'
  if (apiError.value) return '⚠️'
  if (hasData.value) return '✓'
  return '✗'
})

const hasData = computed(() => {
  return exchangeRate.value.bidPrice !== null &&
         exchangeRate.value.askPrice !== null
})

const getButtonText = computed(() => {
  if (loading.value) return 'Загрузка данных...'
  if (apiError.value) return 'Курс недоступен'
  if (!hasData.value) return 'Данные не загружены'
  return 'Оставить заявку'
})

const formattedLastUpdateTime = computed(() => {
  if (!lastSuccessfulFetchTime.value) return '--:--:--'

  const now = Date.now()
  const lastUpdate = lastSuccessfulFetchTime.value
  const diffSeconds = Math.floor((now - lastUpdate) / 1000)

  if (diffSeconds < 60) {
    return `${diffSeconds} сек назад`
  } else if (diffSeconds < 3600) {
    const minutes = Math.floor(diffSeconds / 60)
    return `${minutes} мин назад`
  } else if (diffSeconds < 86400) {
    const hours = Math.floor(diffSeconds / 3600)
    return `${hours} ч назад`
  } else {
    const date = new Date(lastUpdate)
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
})

const statusMessage = computed(() => {
  if (!lastSuccessfulFetchTime.value) return '⏳ Ожидание данных...'

  const now = Date.now()
  const lastUpdate = lastSuccessfulFetchTime.value
  const diffSeconds = Math.floor((now - lastUpdate) / 1000)

  if (diffSeconds < 60) {
    return '✅ Курс актуален'
  } else if (diffSeconds < 300) {
    return '🟡 Обновляется...'
  } else if (diffSeconds < 1800) {
    return '🟠 Данные могут быть устаревшими'
  } else {
    return '🔴 Требуется обновление'
  }
})

// Форматирование цены
function formatPrice(price) {
  if (price === null || price === undefined) return '--.--'
  return parseFloat(price).toFixed(2)
}

// Форматирование процентов
function formatPercentage(chg) {
  if (chg === null || chg === undefined) return '--.--%'
  const percentage = parseFloat(chg) * 100
  const sign = percentage >= 0 ? '+' : ''
  return `${sign}${percentage.toFixed(2)}%`
}

// Форматирование изменения
function formatChange(change) {
  if (change === null || change === undefined) return '--.--'
  const value = parseFloat(change)
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}`
}

// Класс для изменения цены
function getChangeClass(value) {
  if (value === null || value === undefined) return 'neutral'
  return parseFloat(value) >= 0 ? 'positive' : 'negative'
}

// Получение курса с API через прокси
async function fetchExchangeRate() {
  try {
    loading.value = true
    apiError.value = false
    errorMessage.value = ''

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    const response = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      signal: controller.signal,
      mode: 'cors'
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      let errorData = { message: `HTTP ошибка ${response.status}` }
      try {
        errorData = await response.json()
      } catch {
        // Если ответ не JSON, используем стандартное сообщение
      }
      throw new Error(errorData.message || `HTTP ошибка ${response.status}`)
    }

    const data = await response.json()

    if (data.success && data.data && data.data.usdtRub) {
      const usdtRubData = data.data.usdtRub

      exchangeRate.value = {
        bidPrice: usdtRubData.bidPrice,
        askPrice: usdtRubData.askPrice,
        chg: usdtRubData.chg,
        change: usdtRubData.change,
      }

      // Сохраняем локальное время получения данных
      lastSuccessfulFetchTime.value = Date.now()

    } else {
      throw new Error(data.message || 'Некорректный формат ответа от сервера')
    }

  } catch (error) {
    console.error('❌ Ошибка при получении курса:', error.message)

    apiError.value = true

    if (error.name === 'AbortError') {
      errorMessage.value = 'Превышено время ожидания ответа от сервера'
    } else if (error.message.includes('Failed to fetch')) {
      errorMessage.value = 'Не удалось подключиться к серверу курсов'
    } else if (error.message.includes('HTTP')) {
      errorMessage.value = 'Сервер курсов валют временно недоступен'
    } else {
      errorMessage.value = error.message || 'Не удалось получить актуальный курс'
    }

  } finally {
    loading.value = false
  }
}

// Повторная попытка загрузки
function retryFetch() {
  fetchExchangeRate()
}

// Показ уведомления
function showNotification(type, title, message = '', duration = 5000) {
  const id = Date.now().toString()
  notifications.value.push({
    id,
    type,
    title,
    message,
    duration
  })
  
  // Автоматически удаляем через duration + анимация
  setTimeout(() => {
    removeNotification(id)
  }, duration + 300)
}

function removeNotification(id) {
  const index = notifications.value.findIndex(n => n.id === id)
  if (index > -1) {
    notifications.value.splice(index, 1)
  }
}

// Обработчик изменения телефона с форматированием
function handlePhoneInput(event) {
  const formatted = formatPhone(event.target.value)
  formData.value.phone = formatted
  // Очищаем ошибку при вводе
  if (formErrors.value.phone) {
    delete formErrors.value.phone
  }
}

// Расчет итоговой суммы (+5.5% комиссия)
function calculateTotal() {
  if (formData.value.amount && exchangeRate.value.askPrice) {
    const baseAmount = formData.value.amount * exchangeRate.value.askPrice
    totalAmount.value = baseAmount * 1.055 // +5.5%
  } else {
    totalAmount.value = 0
  }
}

// Обработчик изменения суммы с форматированием
function handleAmountInput(event) {
  const formatted = formatAmount(event.target.value)
  const parsed = parseAmount(formatted)
  
  // Обновляем значение в input (отформатированное)
  event.target.value = formatted
  
  // Сохраняем числовое значение
  formData.value.amount = parsed
  calculateTotal()
  
  // Очищаем ошибку при вводе
  if (formErrors.value.amount) {
    delete formErrors.value.amount
  }
}

// Открытие формы заявки
function openApplicationForm() {
  if (!loading.value && !apiError.value && hasData.value) {
    showApplicationForm.value = true
    
    // Сбрасываем все поля формы (клиент должен ввести данные самостоятельно)
    formData.value.name = ''
    formData.value.email = ''
    formData.value.phone = ''
    formData.value.amount = null
    formData.value.paymentMethod = ''
    formData.value.comment = ''
    formData.value.agreement = false
    formErrors.value = {}
    totalAmount.value = 0
    
    // Показываем кнопку "Назад" в Telegram
    if (isTelegram.value) {
      showBackButton(() => {
        showApplicationForm.value = false
        hideBackButton()
      })
    }
  }
}

// Отправка формы
async function submitApplication() {
  if (!hasData.value) return

  // Валидация формы
  formErrors.value = {}
  const validation = validateForm(formData.value)
  
  if (!validation.isValid) {
    formErrors.value = validation.errors
    // Показываем первую ошибку
    const firstError = Object.values(validation.errors)[0]
    showNotification('error', 'Ошибка валидации', firstError)
    
    // Прокручиваем к первой ошибке
    const firstErrorField = Object.keys(validation.errors)[0]
    const errorElement = document.getElementById(firstErrorField)
    if (errorElement) {
      errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      errorElement.focus()
    }
    return
  }

  formSubmitting.value = true

  try {
    const response = await fetch(API_ORDERS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        name: formData.value.name.trim(),
        phone: formData.value.phone,
        amount: formData.value.amount,
        paymentMethod: formData.value.paymentMethod,
        comment: formData.value.comment?.trim() || '',
        agreement: formData.value.agreement,
        exchangeRate: exchangeRate.value,
        totalAmount: totalAmount.value
      })
    })

    const data = await response.json()

    if (!response.ok) {
      // Обработка ошибок валидации с сервера
      if (data.errors && Array.isArray(data.errors)) {
        const serverErrors = {}
        data.errors.forEach(error => {
          // Пытаемся определить поле по сообщению
          if (error.includes('Имя')) serverErrors.name = error
          else if (error.includes('телефон')) serverErrors.phone = error
          else if (error.includes('Сумма')) serverErrors.amount = error
          else if (error.includes('оплаты')) serverErrors.paymentMethod = error
          else if (error.includes('согласие')) serverErrors.agreement = error
        })
        formErrors.value = { ...formErrors.value, ...serverErrors }
      }
      
      throw new Error(data.message || 'Ошибка при отправке заявки')
    }

    // Отправляем сообщение администратору через Telegram
    try {
      await fetch(API_TELEGRAM_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          orderId: data.data?.id,
          name: formData.value.name.trim(),
          phone: formData.value.phone,
          amount: formData.value.amount,
          totalAmount: totalAmount.value,
          paymentMethod: formData.value.paymentMethod,
          comment: formData.value.comment?.trim() || '',
          exchangeRate: exchangeRate.value,
          telegramUser: telegramUser.value ? {
            id: telegramUser.value.id,
            username: telegramUser.value.username
          } : null
        })
      })
    } catch (telegramError) {
      console.warn('Не удалось отправить уведомление в Telegram:', telegramError)
      // Не прерываем процесс, если отправка в Telegram не удалась
    }

    // Успешная отправка
    showNotification(
      'success',
      'Заявка успешно отправлена!',
      `Номер заявки: #${data.data?.id || 'N/A'}. Мы свяжемся с вами в ближайшее время.`,
      6000
    )

    // Возвращаемся к курсу через небольшую задержку
    setTimeout(() => {
      showApplicationForm.value = false
      hideBackButton()
      
      // Сбрасываем форму (клиент должен ввести данные самостоятельно)
      formData.value.name = ''
      formData.value.email = ''
      formData.value.phone = ''
      formData.value.amount = null
      formData.value.paymentMethod = ''
      formData.value.comment = ''
      formData.value.agreement = false
      formErrors.value = {}
      totalAmount.value = 0
    }, 2000)

  } catch (error) {
    console.error('❌ Ошибка при отправке заявки:', error)
    
    if (error.name === 'AbortError') {
      showNotification('error', 'Ошибка сети', 'Превышено время ожидания ответа от сервера')
    } else if (error.message.includes('Failed to fetch')) {
      showNotification('error', 'Ошибка подключения', 'Не удалось подключиться к серверу. Проверьте подключение к интернету.')
    } else {
      showNotification('error', 'Ошибка отправки', error.message || 'Произошла ошибка при отправке заявки. Попробуйте еще раз.')
    }
  } finally {
    formSubmitting.value = false
  }
}

// Таймеры
let updateTimer = null

// Инициализация
onMounted(() => {
  onUnmounted(() => {
    if (updateTimer) clearInterval(updateTimer)
  })

  fetchExchangeRate()

  updateTimer = setInterval(fetchExchangeRate, UPDATE_INTERVAL)
})
</script>

<style scoped>
.main-container {
  width: 100%;
  min-width: 100vw;
  position: relative;
  min-height: 100vh;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow-x: hidden;
  overflow-y: auto;
  padding: 0;
  margin: 0;
}

.content-wrapper {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 1200px;
  padding: 20px;
  padding-bottom: 40px;
  display: flex;
  justify-content: center;
  box-sizing: border-box;
}

.center-container {
  background: rgba(30, 30, 30, 0.85);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  padding: 40px;
  width: 100%;
  max-width: 500px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.05);
  animation: fadeIn 0.8s ease-out;
  min-height: 650px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-sizing: border-box;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.back-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 10px 20px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 20px;
  align-self: flex-start;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateX(-2px);
}

/* Форма заявки */
.application-form {
  padding-top: 40px;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.form-card {
  background: rgba(40, 40, 40, 0.8);
  border-radius: 20px;
  padding: 30px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  margin-bottom: 40px;
}

.form-header {
  margin-bottom: 25px;
  text-align: center;
}

.form-header h2 {
  font-size: 24px;
  color: white;
  margin: 0 0 8px;
  font-weight: 600;
}

.form-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
}

/* Информация о курсе в форме */
.rate-summary {
  background: rgba(50, 50, 50, 0.6);
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 25px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.rate-summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.rate-summary-item:last-child {
  margin-bottom: 0;
}

.rate-summary-item .rate-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.rate-summary-item .rate-value {
  font-size: 14px;
  color: white;
  font-weight: 500;
}

/* Поля формы */
.form-fields {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
}

.form-input, .form-textarea, select.form-input {
  background: rgba(60, 60, 60, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 12px 16px;
  color: white;
  font-size: 15px;
  transition: all 0.3s ease;
}

.form-input:focus, .form-textarea:focus, select.form-input:focus {
  outline: none;
  border-color: rgba(102, 126, 234, 0.5);
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
}

.form-input::placeholder, .form-textarea::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.form-input-error {
  border-color: #ef4444 !important;
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.1) !important;
}

.form-error {
  color: #ef4444;
  font-size: 12px;
  margin-top: 4px;
  display: block;
}

.agreement-checkbox-error {
  accent-color: #ef4444;
}

.agreement-label-error {
  color: #ef4444;
}

.notifications-container {
  position: fixed;
  top: 0;
  right: 0;
  z-index: 10000;
  pointer-events: none;
}

.notifications-container > * {
  pointer-events: auto;
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

/* Группа ввода суммы */
.amount-input-group {
  position: relative;
}

.amount-input-group .form-input {
  padding-right: 70px;
}

.amount-currency {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
}

.amount-hint {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  margin-top: 4px;
}

/* Итоговая сумма */
.total-amount {
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: 10px;
  padding: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.total-value {
  font-size: 28px;
  font-weight: 700;
  color: #10b981;
}

.total-currency {
  font-size: 18px;
  color: rgba(16, 185, 129, 0.8);
}

.calculation-hint {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  text-align: center;
  margin-top: 4px;
}

/* Соглашение */
.form-agreement {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin: 10px 0;
}

.agreement-checkbox {
  margin-top: 3px;
  accent-color: #667eea;
}

.agreement-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.4;
}

/* Кнопка отправки формы */
.submit-form-btn {
  width: 100%;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: none;
  border-radius: 16px;
  padding: 18px 30px;
  color: white;
  font-size: 17px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  margin-top: auto;
}

.submit-form-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow:
    0 10px 20px rgba(16, 185, 129, 0.3),
    0 0 0 2px rgba(16, 185, 129, 0.1);
}

.submit-form-btn:active:not(:disabled) {
  transform: translateY(-1px);
}

.submit-form-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* Анимация для спиннера */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}


/* Курс доллара */
.exchange-container {
  margin-bottom: 40px;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.exchange-card {
  background: rgba(40, 40, 40, 0.8);
  border-radius: 20px;
  padding: 30px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.rates-content {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.exchange-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 30px;
  flex-shrink: 0;
}

.currency-flag {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.exchange-header h2 {
  font-size: 24px;
  color: white;
  margin: 0;
  font-weight: 600;
}

.connection-status {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  margin-left: auto;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.connection-status.loading {
  background-color: #f59e0b;
  color: white;
  animation: pulse 1.5s infinite;
}

.connection-status.connected {
  background-color: #10b981;
  color: white;
}

.connection-status.error,
.connection-status.disconnected {
  background-color: #ef4444;
  color: white;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Состояние загрузки */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  text-align: center;
  flex-grow: 1;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top: 3px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.loading-state p {
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
}

/* Состояние ошибки */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px;
  text-align: center;
  border: 2px solid rgba(239, 68, 68, 0.3);
  border-radius: 16px;
  background: rgba(239, 68, 68, 0.05);
  flex-grow: 1;
}

.error-icon {
  font-size: 48px;
  margin-bottom: 20px;
}

.error-state h3 {
  color: #ef4444;
  font-size: 20px;
  margin: 0 0 10px;
  font-weight: 600;
}

.error-message {
  color: rgba(255, 255, 255, 0.9);
  font-size: 16px;
  margin: 0 0 10px;
  line-height: 1.4;
}

.error-details {
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  margin: 0 0 20px;
}

.retry-btn {
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.4);
  border-radius: 12px;
  padding: 12px 24px;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.retry-btn:hover {
  background: rgba(239, 68, 68, 0.3);
  transform: translateY(-2px);
}

.retry-icon {
  font-size: 16px;
}

/* Основной контент курса */
.exchange-rates {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 25px;
  flex-shrink: 0;
}

.rate-block {
  background: rgba(50, 50, 50, 0.6);
  border-radius: 16px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
  height: 150px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.rate-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 1px;
  flex-shrink: 0;
}

.rate-value {
  font-size: 32px;
  font-weight: 700;
  color: white;
  margin-bottom: 8px;
  flex-shrink: 0;
  transition: all 0.5s ease;
}

.rate-change {
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
}

.rate-change.positive {
  color: #10b981;
}

.rate-change.negative {
  color: #ef4444;
}

.rate-change.neutral {
  color: rgba(255, 255, 255, 0.6);
}

.rate-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  flex-shrink: 0;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 40px;
}

.info-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  flex-shrink: 0;
}

.info-value {
  font-size: 14px;
  color: white;
  font-weight: 500;
  flex-shrink: 0;
}

.info-item.full-width {
  grid-column: span 2;
  text-align: center;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.status-info {
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 8px;
  padding: 8px;
}

.status-info .info-label {
  color: #10b981;
}

.status-info .info-value {
  color: rgba(16, 185, 129, 0.9);
}
/* Логотип */
.logo-container {
  text-align: center;
  margin-bottom: 40px;
  flex-shrink: 0;
}

.logo-image {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  margin: 0 auto 20px;
  box-shadow: 0 10px 30px rgba(127, 127, 127, 0.3);
}

.logo-title {
  font-size: 28px;
  font-weight: 700;
  color: white;
  margin: 0 0 8px;
  letter-spacing: 0.5px;
}

.logo-subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
  font-weight: 300;
}
/* Кнопка заявки */
.submit-btn {
  width: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 16px;
  padding: 22px 30px;
  color: white;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
  margin-top: auto;
}

.submit-btn:hover:not(.disabled) {
  transform: translateY(-3px);
  box-shadow:
    0 15px 30px rgba(102, 126, 234, 0.4),
    0 0 0 2px rgba(102, 126, 234, 0.1);
}

.submit-btn:active:not(.disabled) {
  transform: translateY(-1px);
}

.submit-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: linear-gradient(135deg, #666 0%, #888 100%);
}

.submit-btn.disabled:hover {
  transform: none;
  box-shadow: none;
}

.btn-icon {
  font-size: 22px;
}

.btn-arrow {
  font-size: 20px;
  opacity: 0.8;
  transition: transform 0.3s ease;
}

.submit-btn:hover:not(.disabled) .btn-arrow {
  transform: translateX(5px);
}

/* Адаптивность */
@media (max-width: 768px) {
  .main-container {
    min-height: 100vh;
    height: auto;
    padding: 0;
    align-items: flex-start; /* Изменено с center на flex-start */
    padding-top: env(safe-area-inset-top, 0); /* Для iPhone с вырезом */
  }

  .content-wrapper {
    width: 100%;
    
    padding: 0;
    border-radius: 0;
    margin: 0;
    box-sizing: border-box;
  }

  .center-container {
    background-color: rgba(30, 30, 30, 0);
    backdrop-filter: blur();
    border: 0;
    margin: 0;
    min-height: auto;
    height: auto;
    max-width: 100%;
    border-radius: 0;
  }

  .logo-container {
    margin-bottom: 30px;
  }

  .logo-image {
    width: 70px;
    height: 70px;
    margin-bottom: 15px;
  }

  .logo-title {
    font-size: 22px;
    margin-bottom: 6px;
  }

  .logo-subtitle {
    font-size: 14px;
  }

  .exchange-rates {
    grid-template-columns: 1fr;
    gap: 15px;
    margin-bottom: 20px;
  }

  .rate-block {
    height: auto;
    min-height: 110px;
    padding: 18px;
  }

  .rate-value {
    font-size: 28px;
  }

  .rate-info {
    grid-template-columns: 1fr;
    gap: 12px;
    padding-top: 15px;
  }

  .info-item.full-width {
    grid-column: span 1;
  }

  .loading-state,
  .error-state {
    padding: 25px 20px;
    min-height: auto;
  }

  .error-icon {
    font-size: 40px;
    margin-bottom: 15px;
  }

  .error-state h3 {
    font-size: 18px;
  }

  .error-message {
    font-size: 14px;
  }

  .submit-btn {
    padding: 18px 20px;
    font-size: 16px;
  }

  .form-card {
    padding: 25px 20px;
  }

  .form-header h2 {
    font-size: 22px;
  }

  .form-group {
    gap: 6px;
  }

  .form-input,
  .form-textarea,
  select.form-input {
    padding: 10px 14px;
    font-size: 14px;
  }

  .total-amount {
    padding: 12px;
  }

  .total-value {
    font-size: 24px;
  }

  .submit-form-btn {
    padding: 16px 20px;
    font-size: 16px;
  }

  .notifications-container {
    top: 10px;
    right: 10px;
    left: 10px;
  }

  .toast {
    min-width: auto;
    max-width: none;
    padding: 14px 18px;
  }
}

@media (max-width: 480px) {
  .main-container {
    padding: 0;
    padding-top: env(safe-area-inset-top, 0);
    align-items: flex-start;
  }

  .content-wrapper {
    padding: 0;
    border-radius: 0;
    box-sizing: border-box;
  }

  .center-container {
    padding: 20px 15px;
    border-radius: 0;
    min-height: auto;

  }

  .logo-image {
    width: 60px;
    height: 60px;
    margin-bottom: 12px;
  }

  .logo-title {
    font-size: 20px;
  }

  .logo-subtitle {
    font-size: 13px;
  }

  .exchange-card {
    padding: 18px 15px;
  }

  .exchange-header {
    margin-bottom: 20px;
  }

  .exchange-header h2 {
    font-size: 20px;
  }

  .rate-block {
    padding: 15px;
    min-height: 100px;
  }

  .rate-value {
    font-size: 24px;
  }

  .rate-label {
    font-size: 12px;
  }

  .rate-change {
    font-size: 12px;
  }

  .rate-info {
    gap: 10px;
    padding-top: 12px;
  }

  .info-label {
    font-size: 11px;
  }

  .info-value {
    font-size: 13px;
  }

  .submit-btn {
    padding: 16px 18px;
    font-size: 15px;
  }

  .form-card {
    padding: 20px 15px;
  }

  .form-header h2 {
    font-size: 20px;
  }

  .form-group label {
    font-size: 13px;
  }

  .form-input,
  .form-textarea,
  select.form-input {
    padding: 10px 12px;
    font-size: 14px;
  }

  .total-value {
    font-size: 22px;
  }

  .submit-form-btn {
    padding: 14px 18px;
    font-size: 15px;
  }

  .toast {
    padding: 12px 16px;
  }

  .toast-title {
    font-size: 14px;
  }

  .toast-message {
    font-size: 12px;
  }
}

/* Для очень маленьких экранов (iPhone SE и подобные) */
@media (max-width: 375px) {
  .center-container {
    padding: 18px 12px;
  }

  .logo-image {
    width: 50px;
    height: 50px;
  }

  .logo-title {
    font-size: 18px;
  }

  .rate-value {
    font-size: 22px;
  }

  .submit-btn {
    padding: 14px 16px;
    font-size: 14px;
  }
}

/* Портретная ориентация на мобильных */
@media (max-width: 768px) and (orientation: portrait) {
  .main-container {
    min-height: 100vh;
    height: 100vh;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }
}

/* Ландшафтная ориентация на мобильных */
@media (max-width: 768px) and (orientation: landscape) {
  .center-container {
    min-height: auto;
    max-height: 95vh;
    overflow-y: auto;
  }

  .logo-container {
    margin-bottom: 20px;
  }

  .logo-image {
    width: 50px;
    height: 50px;
  }
}
</style>
