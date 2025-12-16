const express = require('express')
const fetch = require('node-fetch')
const fs = require('fs').promises
const path = require('path')

const app = express()

// Конфигурация
const RAPIRA_API_URL = process.env.RAPIRA_API_URL || 'https://api.rapira.net/open/market/rates'
const ORDERS_FILE = process.env.ORDERS_FILE || path.join(__dirname, 'data', 'orders.json')
const DATA_DIR = path.dirname(ORDERS_FILE)

// Telegram Bot Configuration
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`

// Создаем директорию для данных, если её нет
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true })
  } catch (error) {
    console.error('Ошибка при создании директории данных:', error.message)
  }
}
ensureDataDir()

// Разрешаем CORS для всех доменов
app.use((req, res, next) => {
  const allowedHeaders = [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control'
  ]

  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', allowedHeaders.join(', '))
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  next()
})

app.use(express.json())

// Middleware для логов
app.use((req, res, next) => {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] ${req.method} ${req.url}`)
  next()
})

// Прокси для получения курсов с Rapira API
app.get('/api/rates', async (req, res) => {
  try {
    console.log('📡 Запрос курсов валют к Rapira API...')
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    
    const response = await fetch(RAPIRA_API_URL, {
      headers: {
        'User-Agent': 'CurrencyExchangeBot/1.0',
        'Accept': 'application/json'
      },
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.error(`❌ API вернул ошибку: ${response.status} ${response.statusText}`)
      return res.status(502).json({
        success: false,
        error: 'API_SERVICE_UNAVAILABLE',
        message: 'Сервис курсов валют временно недоступен',
        statusCode: response.status,
        timestamp: new Date().toISOString()
      })
    }

    const data = await response.json()
    console.log(`✅ Получено ${data.data?.length || 0} валютных пар`)
    
    if (data.code === 0 && Array.isArray(data.data)) {
      const usdtRubData = data.data.find(item => item.symbol === 'USDT/RUB')
      
      if (usdtRubData) {
        const serverTimestamp = new Date().toISOString()
        
        return res.json({
          success: true,
          data: {
            usdtRub: usdtRubData,
            allRates: data.data
          },
          timestamp: serverTimestamp,
          serverTime: serverTimestamp,
          source: 'rapira-api'
        })
      } else {
        return res.status(404).json({
          success: false,
          error: 'PAIR_NOT_FOUND',
          message: 'Курс USDT/RUB не найден в ответе API',
          timestamp: new Date().toISOString()
        })
      }
    } else {
      return res.status(500).json({
        success: false,
        error: 'INVALID_API_RESPONSE',
        message: 'Некорректный формат ответа от сервиса курсов',
        timestamp: new Date().toISOString()
      })
    }

  } catch (error) {
    console.error('❌ Критическая ошибка при запросе к API:', error.message)
    
    if (error.name === 'AbortError') {
      return res.status(504).json({
        success: false,
        error: 'REQUEST_TIMEOUT',
        message: 'Превышено время ожидания ответа от сервиса курсов',
        timestamp: new Date().toISOString()
      })
    }
    
    return res.status(503).json({
      success: false,
      error: 'NETWORK_ERROR',
      message: 'Ошибка сети при подключении к сервису курсов',
      timestamp: new Date().toISOString()
    })
  }
})

// Валидация данных заявки
function validateOrder(order) {
  const errors = []
  
  if (!order.name || order.name.trim().length < 2) {
    errors.push('Имя должно содержать минимум 2 символа')
  }
  
  if (!order.phone || !/^\+?7[\d\s\-\(\)]{10,}$/.test(order.phone.replace(/\s/g, ''))) {
    errors.push('Некорректный формат телефона')
  }
  
  if (!order.amount || order.amount < 1 || order.amount > 10000) {
    errors.push('Сумма должна быть от 1 до 10,000 USDT')
  }
  
  if (!order.paymentMethod) {
    errors.push('Необходимо выбрать способ оплаты')
  }
  
  if (!order.agreement) {
    errors.push('Необходимо согласие на обработку персональных данных')
  }
  
  return errors
}

// Эндпоинт для сохранения заявок
app.post('/api/orders', async (req, res) => {
  try {
    const orderData = req.body
    
    // Валидация
    const validationErrors = validateOrder(orderData)
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Ошибка валидации данных',
        errors: validationErrors,
        timestamp: new Date().toISOString()
      })
    }
    
    // Создаем заявку
    const order = {
      id: Date.now().toString(),
      ...orderData,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    // Читаем существующие заявки
    let orders = []
    try {
      const data = await fs.readFile(ORDERS_FILE, 'utf8')
      orders = JSON.parse(data)
    } catch (error) {
      // Файл не существует или пустой - создаем новый массив
      orders = []
    }
    
    // Добавляем новую заявку
    orders.push(order)
    
    // Сохраняем в файл
    await fs.writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf8')
    
    console.log(`✅ Заявка #${order.id} успешно сохранена`)
    
    res.status(201).json({
      success: true,
      message: 'Заявка успешно создана',
      data: {
        id: order.id,
        status: order.status,
        createdAt: order.createdAt
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Ошибка при сохранении заявки:', error.message)
    
    res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Ошибка при сохранении заявки',
      timestamp: new Date().toISOString()
    })
  }
})

// Форматирование способа оплаты для сообщения
function formatPaymentMethod(method) {
  const methods = {
    'bank_card': '💳 Банковская карта',
    'sberbank': '🏦 Сбербанк Онлайн',
    'tinkoff': '💙 Тинькофф',
    'yoomoney': '💚 ЮMoney',
    'qiwi': '🟠 QIWI'
  }
  return methods[method] || method
}

// Форматирование сообщения для администратора
function formatAdminMessage(orderData) {
  const {
    orderId,
    name,
    phone,
    amount,
    totalAmount,
    paymentMethod,
    comment,
    exchangeRate,
    telegramUser
  } = orderData

  let message = `📝 <b>Новая заявка на обмен валюты</b>\n\n`
  message += `🆔 <b>Номер заявки:</b> #${orderId}\n`
  message += `👤 <b>Имя:</b> ${name}\n`
  message += `📞 <b>Телефон:</b> ${phone}\n`
  
  if (telegramUser) {
    message += `\n📱 <b>Telegram:</b>\n`
    message += `   • ID: <code>${telegramUser.id}</code>\n`
    if (telegramUser.username) {
      message += `   • Username: @${telegramUser.username}\n`
    }
  }
  
  message += `\n💰 <b>Детали обмена:</b>\n`
  message += `   • Сумма: <b>${amount} USDT</b>\n`
  message += `   • К получению: <b>${parseFloat(totalAmount).toFixed(2)} RUB</b>\n`
  message += `   • Курс: <code>${parseFloat(exchangeRate.askPrice).toFixed(2)} ₽</code>\n`
  message += `   • Способ оплаты: ${formatPaymentMethod(paymentMethod)}\n`
  
  if (comment && comment.trim()) {
    message += `\n💬 <b>Комментарий:</b>\n${comment}\n`
  }
  
  message += `\n⏰ <b>Время:</b> ${new Date().toLocaleString('ru-RU')}\n`
  
  return message
}

// Эндпоинт для отправки сообщения администратору через Telegram
app.post('/api/telegram/send', async (req, res) => {
  try {
    // Проверяем наличие конфигурации Telegram
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_ADMIN_CHAT_ID) {
      console.warn('⚠️ Telegram Bot не настроен. Пропускаем отправку сообщения.')
      return res.status(200).json({
        success: false,
        message: 'Telegram Bot не настроен',
        skipped: true
      })
    }

    const orderData = req.body
    
    // Форматируем сообщение
    const message = formatAdminMessage(orderData)
    
    // Отправляем сообщение через Telegram Bot API
    const telegramResponse = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_ADMIN_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      })
    })

    const telegramData = await telegramResponse.json()

    if (!telegramResponse.ok) {
      console.error('❌ Ошибка при отправке сообщения в Telegram:', telegramData)
      return res.status(500).json({
        success: false,
        error: 'TELEGRAM_SEND_ERROR',
        message: 'Не удалось отправить сообщение в Telegram',
        telegramError: telegramData.description,
        timestamp: new Date().toISOString()
      })
    }

    console.log(`✅ Сообщение отправлено администратору в Telegram (заявка #${orderData.orderId})`)

    res.json({
      success: true,
      message: 'Сообщение успешно отправлено администратору',
      messageId: telegramData.result?.message_id,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Ошибка при отправке сообщения в Telegram:', error.message)
    
    res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Ошибка при отправке сообщения в Telegram',
      timestamp: new Date().toISOString()
    })
  }
})

// Health check эндпоинт
app.get('/api/health', async (req, res) => {
  try {
    const testResponse = await fetch(RAPIRA_API_URL, {
      timeout: 5000
    })
    
    const apiStatus = testResponse.ok ? 'healthy' : 'unhealthy'
    
    const telegramConfigured = !!(TELEGRAM_BOT_TOKEN && TELEGRAM_ADMIN_CHAT_ID)
    
    res.json({
      status: 'healthy',
      apiStatus: apiStatus,
      telegramConfigured: telegramConfigured,
      timestamp: new Date().toISOString(),
      service: 'Currency Exchange Proxy',
      version: '1.0.0',
      uptime: process.uptime()
    })
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      apiStatus: 'unavailable',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
})

// Обработка 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'ENDPOINT_NOT_FOUND',
    message: 'Запрашиваемый эндпоинт не найден',
    path: req.url,
    timestamp: new Date().toISOString()
  })
})

// Глобальный обработчик ошибок
app.use((error, req, res, next) => {
  console.error('🔥 Необработанная ошибка сервера:', error)
  
  res.status(500).json({
    success: false,
    error: 'INTERNAL_SERVER_ERROR',
    message: 'Внутренняя ошибка сервера',
    timestamp: new Date().toISOString()
  })
})

// Запуск сервера
const PORT = process.env.PORT || 3000
// Используем 0.0.0.0 для доступа извне, localhost только для разработки
const HOST = process.env.HOST || (process.env.NODE_ENV === 'production' ? '0.0.0.0' : '0.0.0.0')

app.listen(PORT, HOST, () => {
  console.log(`
╔══════════════════════════════════════════════════════╗
║        🚀 ПРОКСИ СЕРВЕР КУРСОВ ВАЛЮТ                ║
╠══════════════════════════════════════════════════════╣
║  📡 Статус:    Запущен                               ║
║  🌐 Адрес:     http://${HOST}:${PORT}               ║
║  ⏰ Время:     ${new Date().toLocaleString('ru-RU')} ║
╠══════════════════════════════════════════════════════╣
║  📊 Доступные эндпоинты:                            ║
║                                                      ║
║  • GET /api/rates          - Курсы валют            ║
║  • POST /api/orders       - Создание заявки        ║
║  • POST /api/telegram/send - Отправка в Telegram   ║
║  • GET /api/health         - Проверка состояния    ║
║                                                      ║
║  ${TELEGRAM_BOT_TOKEN ? '✅' : '⚠️ '} Telegram Bot: ${TELEGRAM_BOT_TOKEN ? 'Настроен' : 'Не настроен'}                    ║
║  🔧 CORS настроен для всех доменов                  ║
╚══════════════════════════════════════════════════════╝
  `)
})