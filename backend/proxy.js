const path = require('path');
const express = require('express');
const fetch = require('node-fetch');
const fs = require('fs').promises;

const app = express();

// ================= КОНФИГУРАЦИЯ =================
// Загружаем .env файл с явным указанием пути
require('dotenv').config({ path: path.join(__dirname, '.env') });

const RAPIRA_API_URL = process.env.RAPIRA_API_URL || 'https://api.rapira.net/open/market/rates';
const ORDERS_FILE = process.env.ORDERS_FILE || path.join(__dirname, 'data', 'orders.json');
const DATA_DIR = path.dirname(ORDERS_FILE);

// Telegram Bot Configuration
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_ADMIN_CHAT_IDS = process.env.TELEGRAM_ADMIN_CHAT_IDS 
    ? process.env.TELEGRAM_ADMIN_CHAT_IDS.split(',').map(id => id.trim()).filter(id => id)
    : [];
const TELEGRAM_API_URL = TELEGRAM_BOT_TOKEN ? `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}` : null;

// Отладочный вывод
console.log('🔍 Проверка переменных окружения:');
console.log('  TELEGRAM_BOT_TOKEN:', TELEGRAM_BOT_TOKEN ? `SET (${TELEGRAM_BOT_TOKEN.substring(0, 10)}...)` : 'NOT SET');
console.log('  TELEGRAM_ADMIN_CHAT_IDS:', TELEGRAM_ADMIN_CHAT_IDS.length > 0 ? `SET [${TELEGRAM_ADMIN_CHAT_IDS.join(', ')}]` : 'NOT SET');

// ================= ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =================
// Создаем директорию для данных, если её нет
async function ensureDataDir() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
    } catch (error) {
        console.error('Ошибка при создании директории данных:', error.message);
    }
}
ensureDataDir();

// Форматирование способа оплаты
function formatPaymentMethod(method) {
    const methods = {
        'bank_card': '💳 Банковская карта',
        'sberbank': '🏦 Сбербанк Онлайн',
        'tinkoff': '💙 Тинькофф',
        'yoomoney': '💚 ЮMoney',
        'qiwi': '🟠 QIWI'
    };
    return methods[method] || method;
}

// Форматирование сообщения для администратора
function formatAdminMessage(orderData) {
    const { orderId, name, phone, amount, totalAmount, paymentMethod, comment, exchangeRate, telegramUser } = orderData;

    let message = `📝 <b>Новая заявка на обмен валюты</b>\n\n`;
    message += `🆔 <b>Номер заявки:</b> #${orderId}\n`;
    message += `👤 <b>Имя:</b> ${name}\n`;
    message += `📞 <b>Телефон:</b> ${phone}\n`;
    
    if (telegramUser) {
        message += `\n📱 <b>Telegram:</b>\n`;
        message += `   • ID: <code>${telegramUser.id}</code>\n`;
        if (telegramUser.username) {
            message += `   • Username: @${telegramUser.username}\n`;
        }
    }
    
    message += `\n💰 <b>Детали обмена:</b>\n`;
    message += `   • Сумма: <b>${amount} USDT</b>\n`;
    message += `   • К получению: <b>${parseFloat(totalAmount).toFixed(2)} RUB</b>\n`;
    
    const rapiraRate = exchangeRate.bidPrice ? parseFloat(exchangeRate.bidPrice).toFixed(2) : 
                       exchangeRate.askPrice ? parseFloat(exchangeRate.askPrice).toFixed(2) : 'N/A';
    
    const ourRate = amount && totalAmount ? (parseFloat(totalAmount) / parseFloat(amount)).toFixed(2) : 
                    exchangeRate.bidPrice ? (parseFloat(exchangeRate.bidPrice) * 1.055).toFixed(2) : 
                    exchangeRate.askPrice ? parseFloat(exchangeRate.askPrice).toFixed(2) : 'N/A';
    
    message += `   • Курс на Rapira: <code>${rapiraRate} ₽</code>\n`;
    message += `   • Наш курс: <code>${ourRate} ₽</code>\n`;
    message += `   • Способ оплаты: ${formatPaymentMethod(paymentMethod)}\n`;
    
    if (comment && comment.trim()) {
        message += `\n💬 <b>Комментарий:</b>\n${comment}\n`;
    }
    
    message += `\n⏰ <b>Время:</b> ${new Date().toLocaleString('ru-RU')}\n`;
    
    return message;
}

// Форматирование сообщения для клиента
function formatClientMessage(orderData) {
    const { orderId, name, phone, amount, totalAmount, paymentMethod, comment, exchangeRate, telegramUser } = orderData;

    let message = `✅ <b>Вы успешно оставили заявку на обмен валюты</b>\n\n`;
    message += `📋 <b>Ваша заявка:</b>\n\n`;
    message += `🆔 <b>Номер заявки:</b> #${orderId}\n`;
    message += `👤 <b>Имя:</b> ${name}\n`;
    message += `📞 <b>Телефон:</b> ${phone}\n`;
    
    if (telegramUser && telegramUser.username) {
        message += `\n📱 <b>Telegram:</b>\n`;
        message += `   • Username: @${telegramUser.username}\n`;
    }
    
    message += `\n💰 <b>Детали обмена:</b>\n`;
    message += `   • Сумма: <b>${amount} USDT</b>\n`;
    message += `   • К получению: <b>${parseFloat(totalAmount).toFixed(2)} RUB</b>\n`;
    
    const rapiraRate = exchangeRate.bidPrice ? parseFloat(exchangeRate.bidPrice).toFixed(2) : 
                       exchangeRate.askPrice ? parseFloat(exchangeRate.askPrice).toFixed(2) : 'N/A';
    
    const ourRate = amount && totalAmount ? (parseFloat(totalAmount) / parseFloat(amount)).toFixed(2) : 
                    exchangeRate.bidPrice ? (parseFloat(exchangeRate.bidPrice) * 1.055).toFixed(2) : 
                    exchangeRate.askPrice ? parseFloat(exchangeRate.askPrice).toFixed(2) : 'N/A';
    
    message += `   • Курс на Rapira: <code>${rapiraRate} ₽</code>\n`;
    message += `   • Наш курс: <code>${ourRate} ₽</code>\n`;
    message += `   • Способ оплаты: ${formatPaymentMethod(paymentMethod)}\n`;
    
    if (comment && comment.trim()) {
        message += `\n💬 <b>Комментарий:</b>\n${comment}\n`;
    }
    
    message += `\n⏰ <b>Время:</b> ${new Date().toLocaleString('ru-RU')}\n\n`;
    message += `👨‍💼 <b>Администратор скоро свяжется с вами</b>`;
    
    return message;
}

// Отправка сообщения одному пользователю
async function sendTelegramMessage(chatId, text) {
    try {
        const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
                parse_mode: 'HTML',
                disable_web_page_preview: true
            }),
            timeout: 10000 // 10 секунд таймаут
        });

        const data = await response.json();
        
        return {
            success: response.ok,
            chatId: chatId,
            messageId: data.result?.message_id,
            error: data.description || null
        };
    } catch (error) {
        return {
            success: false,
            chatId: chatId,
            error: error.message
        };
    }
}

// ================= MIDDLEWARE =================
// CORS для всех доменов
app.use((req, res, next) => {
    const allowedHeaders = ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'Cache-Control'];
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', allowedHeaders.join(', '));
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    
    if (req.method === 'OPTIONS') return res.status(200).end();
    next();
});

app.use(express.json());

// Логирование запросов
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.url}`);
    next();
});

// ================= ОСНОВНЫЕ ЭНДПОИНТЫ =================
// Прокси для получения курсов с Rapira API
app.get('/api/rates', async (req, res) => {
    try {
        console.log('📡 Запрос курсов валют к Rapira API...');
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(RAPIRA_API_URL, {
            headers: {
                'User-Agent': 'CurrencyExchangeBot/1.0',
                'Accept': 'application/json'
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            console.error(`❌ API вернул ошибку: ${response.status} ${response.statusText}`);
            return res.status(502).json({
                success: false,
                error: 'API_SERVICE_UNAVAILABLE',
                message: 'Сервис курсов валют временно недоступен',
                statusCode: response.status,
                timestamp: new Date().toISOString()
            });
        }

        const data = await response.json();
        console.log(`✅ Получено ${data.data?.length || 0} валютных пар`);
        
        if (data.code === 0 && Array.isArray(data.data)) {
            const usdtRubData = data.data.find(item => item.symbol === 'USDT/RUB');
            
            if (usdtRubData) {
                const serverTimestamp = new Date().toISOString();
                
                return res.json({
                    success: true,
                    data: {
                        usdtRub: usdtRubData,
                        allRates: data.data
                    },
                    timestamp: serverTimestamp,
                    serverTime: serverTimestamp,
                    source: 'rapira-api'
                });
            } else {
                return res.status(404).json({
                    success: false,
                    error: 'PAIR_NOT_FOUND',
                    message: 'Курс USDT/RUB не найден в ответе API',
                    timestamp: new Date().toISOString()
                });
            }
        } else {
            return res.status(500).json({
                success: false,
                error: 'INVALID_API_RESPONSE',
                message: 'Некорректный формат ответа от сервиса курсов',
                timestamp: new Date().toISOString()
            });
        }

    } catch (error) {
        console.error('❌ Критическая ошибка при запросе к API:', error.message);
        
        if (error.name === 'AbortError') {
            return res.status(504).json({
                success: false,
                error: 'REQUEST_TIMEOUT',
                message: 'Превышено время ожидания ответа от сервиса курсов',
                timestamp: new Date().toISOString()
            });
        }
        
        return res.status(503).json({
            success: false,
            error: 'NETWORK_ERROR',
            message: 'Ошибка сети при подключении к сервису курсов',
            timestamp: new Date().toISOString()
        });
    }
});

// Валидация данных заявки
function validateOrder(order) {
    const errors = [];
    
    if (!order.name || order.name.trim().length < 2) {
        errors.push('Имя должно содержать минимум 2 символа');
    }
    
    if (!order.phone || !/^\+?7[\d\s\-\(\)]{10,}$/.test(order.phone.replace(/\s/g, ''))) {
        errors.push('Некорректный формат телефона');
    }
    
    if (!order.amount || order.amount < 1 || order.amount > 10000) {
        errors.push('Сумма должна быть от 1 до 10,000 USDT');
    }
    
    if (!order.paymentMethod) {
        errors.push('Необходимо выбрать способ оплаты');
    }
    
    if (!order.agreement) {
        errors.push('Необходимо согласие на обработку персональных данных');
    }
    
    return errors;
}

// Эндпоинт для сохранения заявок
app.post('/api/orders', async (req, res) => {
    try {
        const orderData = req.body;
        
        // Валидация
        const validationErrors = validateOrder(orderData);
        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'VALIDATION_ERROR',
                message: 'Ошибка валидации данных',
                errors: validationErrors,
                timestamp: new Date().toISOString()
            });
        }
        
        // Создаем заявку
        const order = {
            id: Date.now().toString(),
            ...orderData,
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // Читаем существующие заявки
        let orders = [];
        try {
            const data = await fs.readFile(ORDERS_FILE, 'utf8');
            orders = JSON.parse(data);
        } catch (error) {
            // Файл не существует или пустой - создаем новый массив
            orders = [];
        }
        
        // Добавляем новую заявку
        orders.push(order);
        
        // Сохраняем в файл
        await fs.writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf8');
        
        console.log(`✅ Заявка #${order.id} успешно сохранена`);
        
        res.status(201).json({
            success: true,
            message: 'Заявка успешно создана',
            data: {
                id: order.id,
                status: order.status,
                createdAt: order.createdAt
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Ошибка при сохранении заявки:', error.message);
        
        res.status(500).json({
            success: false,
            error: 'INTERNAL_SERVER_ERROR',
            message: 'Ошибка при сохранении заявки',
            timestamp: new Date().toISOString()
        });
    }
});

// Эндпоинт для отправки сообщения ВСЕМ администраторам (параллельно)
app.post('/api/telegram/send', async (req, res) => {
    try {
        // Проверяем наличие конфигурации Telegram
        if (!TELEGRAM_BOT_TOKEN || TELEGRAM_ADMIN_CHAT_IDS.length === 0) {
            console.warn('⚠️ Telegram Bot не настроен. Пропускаем отправку сообщения.');
            return res.status(200).json({
                success: false,
                message: 'Telegram Bot не настроен',
                skipped: true,
                timestamp: new Date().toISOString()
            });
        }

        const orderData = req.body;
        
        // Форматируем сообщения
        const adminMessage = formatAdminMessage(orderData);
        const clientMessage = orderData.telegramUser ? formatClientMessage(orderData) : null;
        
        console.log(`🚀 Отправка заявки #${orderData.orderId} администраторам: ${TELEGRAM_ADMIN_CHAT_IDS.join(', ')}`);
        
        // 🔥 ПАРАЛЛЕЛЬНАЯ отправка всем администраторам (оптимизировано)
        const adminPromises = TELEGRAM_ADMIN_CHAT_IDS.map(chatId => 
            sendTelegramMessage(chatId, adminMessage)
        );
        
        const adminResults = await Promise.all(adminPromises);
        
        // Отправляем сообщение клиенту (если есть)
        let clientResult = null;
        if (clientMessage && orderData.telegramUser && orderData.telegramUser.id) {
            clientResult = await sendTelegramMessage(orderData.telegramUser.id, clientMessage);
            if (clientResult.success) {
                console.log(`✅ Сообщение отправлено клиенту ${orderData.telegramUser.id}`);
            }
        }
        
        // Анализируем результаты
        const successfulAdmins = adminResults.filter(r => r.success);
        const failedAdmins = adminResults.filter(r => !r.success);
        
        // Логируем результаты
        if (successfulAdmins.length > 0) {
            console.log(`✅ Сообщение успешно отправлено ${successfulAdmins.length} из ${TELEGRAM_ADMIN_CHAT_IDS.length} администраторов`);
        }
        if (failedAdmins.length > 0) {
            console.warn(`⚠️ Не удалось отправить ${failedAdmins.length} администраторам:`, 
                failedAdmins.map(f => `${f.chatId}: ${f.error}`).join(', '));
        }
        
        // Формируем ответ
        const response = {
            success: successfulAdmins.length > 0,
            message: successfulAdmins.length > 0 
                ? `Сообщение отправлено ${successfulAdmins.length} из ${TELEGRAM_ADMIN_CHAT_IDS.length} администраторов`
                : 'Не удалось отправить сообщение ни одному администратору',
            stats: {
                totalAdmins: TELEGRAM_ADMIN_CHAT_IDS.length,
                successful: successfulAdmins.length,
                failed: failedAdmins.length
            },
            adminResults: adminResults,
            clientResult: clientResult,
            timestamp: new Date().toISOString()
        };
        
        res.json(response);

    } catch (error) {
        console.error('❌ Общая ошибка при отправке сообщений в Telegram:', error.message);
        
        res.status(500).json({
            success: false,
            error: 'INTERNAL_SERVER_ERROR',
            message: 'Ошибка при отправке сообщений в Telegram',
            timestamp: new Date().toISOString()
        });
    }
});

// Health check эндпоинт
app.get('/api/health', async (req, res) => {
    try {
        const testResponse = await fetch(RAPIRA_API_URL, { timeout: 5000 });
        const apiStatus = testResponse.ok ? 'healthy' : 'unhealthy';
        const telegramConfigured = !!(TELEGRAM_BOT_TOKEN && TELEGRAM_ADMIN_CHAT_IDS.length > 0);
        
        res.json({
            status: 'healthy',
            apiStatus: apiStatus,
            telegramConfigured: telegramConfigured,
            telegramAdmins: TELEGRAM_ADMIN_CHAT_IDS.length,
            timestamp: new Date().toISOString(),
            service: 'Currency Exchange Proxy',
            version: '1.0.0',
            uptime: process.uptime()
        });
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            apiStatus: 'unavailable',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// ================= АДМИНСКАЯ ЗАЩИТА =================
const ADMIN_IDS = process.env.ADMIN_IDS ? 
    process.env.ADMIN_IDS.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id)) 
    : [];

// Middleware для проверки
function adminOnlyMiddleware(req, res, next) {
    const telegramId = req.headers['x-telegram-user-id'];
    
    if (!telegramId) {
        return res.status(401).json({ 
            success: false,
            error: 'AUTH_REQUIRED',
            message: 'Требуется авторизация через Telegram' 
        });
    }
    
    const userId = parseInt(telegramId);
    
    if (!ADMIN_IDS.includes(userId)) {
        return res.status(403).json({ 
            success: false,
            error: 'ACCESS_DENIED',
            message: 'Доступ запрещён' 
        });
    }
    
    // Всё ок - фронтенд уже знает, что делать
    next();
}

// Защищённый API endpoint для проверки прав
app.get('/api/auth/check-admin', adminOnlyMiddleware, (req, res) => {
    res.json({ 
        success: true,
        isAdmin: true,
        message: 'Доступ разрешён' 
    });
});

// Обработка 404
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'ENDPOINT_NOT_FOUND',
        message: 'Запрашиваемый эндпоинт не найден',
        path: req.url,
        timestamp: new Date().toISOString()
    });
});

// Глобальный обработчик ошибок
app.use((error, req, res, next) => {
    console.error('🔥 Необработанная ошибка сервера:', error);
    
    res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Внутренняя ошибка сервера',
        timestamp: new Date().toISOString()
    });
});

// ================= ЗАПУСК СЕРВЕРА =================
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || (process.env.NODE_ENV === 'production' ? '0.0.0.0' : '0.0.0.0');

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
║  👥 Администраторов: ${TELEGRAM_ADMIN_CHAT_IDS.length}                              ║
║  🔧 CORS настроен для всех доменов                  ║
╚══════════════════════════════════════════════════════╝
    `);
});