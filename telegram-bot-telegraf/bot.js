require("dotenv").config();
const { Telegraf, Markup } = require("telegraf");

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const webAppUrl = process.env.WEB_APP_URL || "https://xcoinapp.ru";
const adminAppUrl = process.env.ADMIN_APP_URL || "https://xcoinapp.ru/admin";

// Список администраторов
const ADMIN_IDS = process.env.ADMIN_IDS
  ? process.env.ADMIN_IDS.split(",").map((id) => parseInt(id.trim()))
  : [5124192112];

// Проверка прав администратора
const isAdmin = (userId) => ADMIN_IDS.includes(userId);

// Создание виртуальной клавиатуры
const getMainKeyboard = (userId) => {
  const buttons = [
    [Markup.button.webApp("📝 Оставить заявку", webAppUrl)],
    ["/start"],
  ];

  if (isAdmin(userId)) {
    buttons.unshift([
      Markup.button.webApp(
        "👑 Админ-панель",
        `${adminAppUrl}?admin_id=${userId}`
      ),
    ]);
  }

  return Markup.keyboard(buttons).resize();
};

bot.start((ctx) => {
  const userName = ctx.from.first_name || "друг";

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

  return ctx.reply(message, {
    ...Markup.inlineKeyboard([
      Markup.button.webApp("Оставить заявку", webAppUrl),
    ]),
    ...getMainKeyboard(ctx.from.id),
  });
});

// Команда /order - открывает мини-приложение
bot.command("order", (ctx) => {
  return ctx.reply(
    "📝 Открываю форму для заявки...",
    Markup.inlineKeyboard([
      Markup.button.webApp("📋 Заполнить заявку", webAppUrl),
    ])
  );
});

// Команда /admin - проверяет права и открывает админ-панель
bot.command("admin", (ctx) => {
  if (!isAdmin(ctx.from.id)) {
    return ctx.reply("⛔ У вас нет доступа к админ-панели.");
  }

  const adminUrl = `${adminAppUrl}?admin_id=${ctx.from.id}`;

  // Отправляем сразу Web App
  return ctx.reply(
    "Открываю админ-панель...",
    Markup.inlineKeyboard([Markup.button.webApp("⚙️ Админ-панель", adminUrl)])
  );
});

// Кнопка "📝 Оставить заявку" - открывает мини-приложение
bot.hears("📝 Оставить заявку", (ctx) => {
  const userAppUrl = `${webAppUrl}?user_id=${ctx.from.id}`;

  return ctx.reply(
    "📝 Открываю форму для заявки...",
    Markup.inlineKeyboard([
      Markup.button.webApp("📋 Заполнить заявку", userAppUrl),
    ])
  );
});

// Кнопка "👑 Админ-панель" - открывает админ-панель (только для админов)
bot.hears("👑 Админ-панель", (ctx) => {
  if (!isAdmin(ctx.from.id)) {
    return ctx.reply("⛔ Доступ запрещен!");
  }

  const adminUrl = adminAppUrl;

  return ctx.reply(
    "👑 Открываю админ-панель...",
    Markup.inlineKeyboard([Markup.button.webApp("⚙️ Админ-панель", adminUrl)])
  );
});

bot.help((ctx) => ctx.reply("Нажмите /start для начала работы"));

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

if (process.env.TELEGRAM_BOT_TOKEN) {
  bot
    .launch()
    .then(() => {
      console.log("Bot started successfully");
    })
    .catch((err) => {
      console.error("Failed to start bot:", err);
    });
} else {
  console.error("TELEGRAM_BOT_TOKEN is not set");
}
