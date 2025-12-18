# 💱 Currency Exchange Bot

Telegram Web App для обмена криптовалюты USDT на рубли с автоматическим получением курсов и отправкой уведомлений.

## 📋 Описание проекта

Это полнофункциональное приложение для обмена валюты, состоящее из:
- **Frontend** (Vue.js) - веб-интерфейс для Telegram Web App
- **Backend** (Node.js/Express) - API сервер для получения курсов и обработки заявок

### Основные возможности

- 📊 Отображение актуального курса USDT/RUB с биржи Rapira
- 💰 Расчет курса с комиссией (+5.5%)
- 📝 Создание заявок на обмен валюты
- 📱 Интеграция с Telegram Bot для уведомлений
- 🔔 Автоматическая отправка сообщений администратору и клиенту
- 📱 Адаптивный дизайн для мобильных устройств

## 🏗️ Структура проекта

```
CriptoBotTG/
├── backend/                 # Backend API сервер
│   ├── proxy.js            # Основной файл сервера
│   ├── package.json        # Зависимости backend
│   └── data/               # Данные (заявки)
│       └── orders.json     # Файл с заявками
│
├── frontend/               # Frontend приложение
│   ├── src/
│   │   ├── components/     # Vue компоненты
│   │   │   ├── MainVue.vue          # Главный компонент
│   │   │   ├── ToastNotification.vue # Уведомления
│   │   │   └── AnimatedBackground.vue # Анимированный фон
│   │   ├── composables/    # Vue composables
│   │   │   └── useTelegram.js       # Работа с Telegram Web App
│   │   ├── utils/          # Утилиты
│   │   │   ├── format.js   # Форматирование данных
│   │   │   └── validation.js # Валидация форм
│   │   └── assets/         # Стили и ресурсы
│   ├── dist/               # Собранные файлы (production)
│   └── package.json        # Зависимости frontend
│
├── .github/
│   └── workflows/
│       └── deploy.yml      # GitHub Actions для автодеплоя
│
├── nginx-config.conf       # Конфигурация Nginx
├── deploy.sh              # Скрипт для быстрого деплоя
└── README.md              # Этот файл
```

## 🔧 Как это работает

### Frontend (Vue.js)

1. **Получение курсов**: Запрашивает актуальный курс USDT/RUB через API `/api/rates`
2. **Отображение**: Показывает два курса:
   - Курс на Rapira (оригинальный)
   - Наш курс (с комиссией +5.5%)
3. **Создание заявки**: Пользователь заполняет форму и отправляет заявку
4. **Расчет суммы**: Автоматически рассчитывает сумму к получению с учетом комиссии

### Backend (Node.js/Express)

1. **Прокси API**: Получает курсы с биржи Rapira и проксирует их клиенту
2. **Обработка заявок**: Сохраняет заявки в JSON файл
3. **Telegram уведомления**: Отправляет сообщения:
   - Администратору (все детали заявки)
   - Клиенту (подтверждение заявки)

### API Endpoints

- `GET /api/rates` - Получение актуального курса USDT/RUB
- `POST /api/orders` - Создание новой заявки
- `POST /api/telegram/send` - Отправка уведомлений в Telegram
- `GET /api/health` - Проверка состояния сервера

## 🚀 Быстрый старт

### Требования

- Node.js 20.x или выше
- npm или yarn
- VPS сервер (для production)
- Telegram Bot Token (опционально, для уведомлений)

### Локальная разработка

1. **Клонируйте репозиторий**
```bash
git clone https://github.com/ваш-username/CriptoBotTG.git
cd CriptoBotTG
```

2. **Настройте Backend**
```bash
cd backend
npm install
cp .env.example .env  # Создайте .env файл
nano .env              # Настройте переменные окружения
```

Создайте файл `backend/.env`:
```env
PORT=3000
RAPIRA_API_URL=https://api.rapira.net/open/market/rates
ORDERS_FILE=./data/orders.json
TELEGRAM_BOT_TOKEN=ваш_токен_бота
TELEGRAM_ADMIN_CHAT_ID=ваш_chat_id
NODE_ENV=development
```

3. **Запустите Backend**
```bash
npm run dev  # или npm start
```

4. **Настройте Frontend**
```bash
cd ../frontend
npm install
```

5. **Запустите Frontend**
```bash
npm run dev
```

Приложение будет доступно на `http://localhost:5173`

## 📦 Деплой на VPS

### Подготовка сервера

1. **Подключитесь к VPS**
```bash
ssh root@ваш-ip-адрес
```

2. **Установите необходимое ПО**
```bash
# Обновление системы
apt update && apt upgrade -y

# Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Nginx
apt install -y nginx

# PM2 (менеджер процессов)
npm install -g pm2
pm2 startup

# Certbot (для SSL)
apt install -y certbot python3-certbot-nginx
```

### Деплой проекта

#### Вариант 1: Автоматический (через GitHub Actions)

1. **Настройте секреты в GitHub**:
   - Перейдите в Settings → Secrets and variables → Actions
   - Добавьте секреты:
     - `VPS_HOST` - IP адрес вашего VPS
     - `VPS_USER` - пользователь (обычно `root`)
     - `VPS_SSH_KEY` - приватный SSH ключ для деплоя

2. **Создайте SSH ключ на VPS**:
```bash
ssh-keygen -t ed25519 -f ~/.ssh/deploy_key -N ""
cat ~/.ssh/deploy_key.pub >> ~/.ssh/authorized_keys
cat ~/.ssh/deploy_key  # Скопируйте этот ключ в GitHub секреты
```

3. **Настройте Git на VPS**:
```bash
cd /var/www/currency-exchange/CriptoBotTG
git init
git remote add origin https://github.com/ваш-username/CriptoBotTG.git
git fetch origin
git checkout main
```

4. **Сделайте push в репозиторий** - деплой запустится автоматически!

#### Вариант 2: Ручной деплой

1. **Создайте структуру папок**
```bash
mkdir -p /var/www/currency-exchange/CriptoBotTG
cd /var/www/currency-exchange/CriptoBotTG
```

2. **Загрузите проект** (через Git, SCP или zip)

3. **Настройте Backend**
```bash
cd backend
npm install --production

# Создайте .env файл
nano .env
```

Вставьте:
```env
PORT=3000
RAPIRA_API_URL=https://api.rapira.net/open/market/rates
ORDERS_FILE=/var/www/currency-exchange/CriptoBotTG/backend/data/orders.json
TELEGRAM_BOT_TOKEN=ваш_токен_бота
TELEGRAM_ADMIN_CHAT_ID=ваш_chat_id
NODE_ENV=production
```

4. **Запустите Backend через PM2**
```bash
mkdir -p data
chmod 755 data
pm2 start proxy.js --name "currency-backend"
pm2 save
```

5. **Соберите Frontend**
```bash
cd ../frontend
npm install
npm run build
mkdir -p ../public
cp -r dist/* ../public/
```

6. **Настройте Nginx**

Создайте файл `/etc/nginx/sites-available/currency-exchange`:
```nginx
upstream backend {
    server 127.0.0.1:3000;
}

server {
    listen 80;
    server_name ваш-домен.com www.ваш-домен.com;

    access_log /var/log/nginx/currency-exchange-access.log;
    error_log /var/log/nginx/currency-exchange-error.log;
    client_max_body_size 10M;

    # API запросы
    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Статические файлы Frontend
    location / {
        root /var/www/currency-exchange/CriptoBotTG/public;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

Активируйте конфигурацию:
```bash
ln -s /etc/nginx/sites-available/currency-exchange /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

7. **Настройте Firewall**
```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

8. **Установите SSL сертификат** (если есть домен)
```bash
certbot --nginx -d ваш-домен.com -d www.ваш-домен.com
```

### Настройка Telegram Bot

1. **Создайте бота**:
   - Найдите @BotFather в Telegram
   - Отправьте `/newbot`
   - Следуйте инструкциям
   - Скопируйте токен

2. **Получите Chat ID**:
   - Найдите @userinfobot в Telegram
   - Отправьте `/start`
   - Скопируйте ваш ID

3. **Добавьте токены в `.env`**:
```env
TELEGRAM_BOT_TOKEN=ваш_токен_бота
TELEGRAM_ADMIN_CHAT_ID=ваш_chat_id
```

4. **Перезапустите Backend**:
```bash
pm2 restart currency-backend
```

## 🔄 Обновление проекта

### Автоматическое обновление (через GitHub Actions)

Просто сделайте `git push` - изменения автоматически задеплоятся на VPS.

### Ручное обновление

```bash
cd /var/www/currency-exchange/CriptoBotTG
git pull origin main

# Backend
cd backend
npm install --production
pm2 restart currency-backend

# Frontend
cd ../frontend
npm install
npm run build
cp -r dist/* ../public/
```

## 🛠️ Разработка

### Структура Frontend

- **MainVue.vue** - главный компонент с формой и отображением курсов
- **ToastNotification.vue** - компонент уведомлений
- **AnimatedBackground.vue** - анимированный фон
- **useTelegram.js** - composable для работы с Telegram Web App SDK

### Структура Backend

- **proxy.js** - основной файл сервера с API endpoints
- **data/orders.json** - файл для хранения заявок

### Переменные окружения

**Backend (.env)**:
- `PORT` - порт сервера (по умолчанию 3000)
- `RAPIRA_API_URL` - URL API для получения курсов
- `ORDERS_FILE` - путь к файлу с заявками
- `TELEGRAM_BOT_TOKEN` - токен Telegram бота
- `TELEGRAM_ADMIN_CHAT_ID` - Chat ID администратора
- `NODE_ENV` - режим работы (development/production)

## 📊 Мониторинг

### Проверка статуса Backend

```bash
pm2 status
pm2 logs currency-backend
pm2 monit
```

### Проверка Nginx

```bash
systemctl status nginx
tail -f /var/log/nginx/currency-exchange-error.log
```

### Проверка API

```bash
curl http://localhost:3000/api/health
curl https://ваш-домен.com/api/rates
```

## 🐛 Решение проблем

### Backend не запускается

```bash
pm2 logs currency-backend
# Проверьте логи на наличие ошибок
```

### 502 Bad Gateway

- Проверьте, что Backend запущен: `pm2 status`
- Проверьте логи Nginx: `tail -f /var/log/nginx/currency-exchange-error.log`
- Проверьте конфигурацию Nginx: `nginx -t`

### Telegram уведомления не работают

- Проверьте `.env` файл - должны быть установлены токены
- Проверьте логи: `pm2 logs currency-backend`
- Убедитесь, что бот запущен и может отправлять сообщения

### Frontend не загружается

- Проверьте права доступа: `chmod -R 755 /var/www/currency-exchange/CriptoBotTG/public`
- Проверьте, что файлы скопированы: `ls -la /var/www/currency-exchange/CriptoBotTG/public`

## 📝 Лицензия

MIT

## 👥 Авторы

Currency Exchange Team

## 🔗 Полезные ссылки

- [Vue.js Documentation](https://vuejs.org/)
- [Express.js Documentation](https://expressjs.com/)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Rapira API](https://api.rapira.net/)

---

**Готово к использованию!** 🚀

