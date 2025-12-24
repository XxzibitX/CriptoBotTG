require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
// URL вашего веб-приложения (Frontend). 
// Если переменная окружения не задана, используется дефолтный домен из nginx конфига.
const webAppUrl = process.env.WEB_APP_URL || 'https://xcoinapp.ru'; 

bot.start((ctx) => {
    // Получаем имя пользователя, или используем дефолтное
    const userName = ctx.from.first_name || 'друг';
    
    const message = `🌟 Добро пожаловать в Vertex, ${userName}! 🌟

Vertex — это надежный сервис для мгновенного обмена USDT на рубли с лучшим курсом на рынке!

🚀 Как начать:
1. Нажмите кнопку "Оставить заявку"
2. Заполните форму на нашем сайте
3. Получите реквизиты для перевода
4. Совершите обмен за 5-15 минут!

Наши гарантии:
✅ Безопасность сделок
✅ Мгновенный вывод
✅ Поддержка 24/7`;

    // Отправляем сообщение с Inline кнопкой, которая открывает Web App
    return ctx.reply(message, Markup.inlineKeyboard([
        Markup.button.webApp('Оставить заявку', webAppUrl)
    ]));
});

bot.help((ctx) => ctx.reply('Нажмите /start для начала работы'));

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

if (process.env.TELEGRAM_BOT_TOKEN) {
    bot.launch().then(() => {
        console.log('Bot started successfully');
    }).catch((err) => {
        console.error('Failed to start bot:', err);
    });
} else {
    console.error('TELEGRAM_BOT_TOKEN is not set');
}
