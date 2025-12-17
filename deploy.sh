#!/bin/bash

# Скрипт для автоматического деплоя на VPS
# Использование: ./deploy.sh root@ваш-ip-адрес

set -e

if [ -z "$1" ]; then
    echo "❌ Ошибка: Укажите адрес сервера"
    echo "Использование: ./deploy.sh root@ваш-ip-адрес"
    exit 1
fi

SERVER=$1
PROJECT_DIR="/var/www/currency-exchange"

echo "🚀 Начинаю деплой на $SERVER..."

# 1. Сборка Frontend
echo "📦 Собираю Frontend..."
cd frontend
npm run build
cd ..

# 2. Создание временной папки
echo "📁 Создаю архив..."
TEMP_DIR=$(mktemp -d)
cp -r backend "$TEMP_DIR/"
cp -r frontend/dist "$TEMP_DIR/frontend-dist"

# 3. Загрузка на сервер
echo "📤 Загружаю файлы на сервер..."
ssh $SERVER "mkdir -p $PROJECT_DIR"
scp -r "$TEMP_DIR/backend" "$SERVER:$PROJECT_DIR/"
scp -r "$TEMP_DIR/frontend-dist" "$SERVER:$PROJECT_DIR/frontend-dist"

# 4. Установка зависимостей и настройка на сервере
echo "⚙️ Настраиваю Backend на сервере..."
ssh $SERVER << 'ENDSSH'
cd /var/www/currency-exchange/backend
npm install --production
mkdir -p data
chmod 755 data

# Создаем .env если его нет
if [ ! -f .env ]; then
    cat > .env << EOF
PORT=3000
RAPIRA_API_URL=https://api.rapira.net/open/market/rates
ORDERS_FILE=/var/www/currency-exchange/backend/data/orders.json
NODE_ENV=production
EOF
    echo "✅ Создан файл .env (не забудьте добавить Telegram токены!)"
fi

# Запускаем через PM2
pm2 delete currency-backend 2>/dev/null || true
pm2 start proxy.js --name "currency-backend"
pm2 save
ENDSSH

# 5. Настройка Frontend
echo "🎨 Настраиваю Frontend на сервере..."
ssh $SERVER << 'ENDSSH'
mkdir -p /var/www/currency-exchange/public
cp -r /var/www/currency-exchange/frontend-dist/* /var/www/currency-exchange/public/
chown -R www-data:www-data /var/www/currency-exchange/public
chmod -R 755 /var/www/currency-exchange/public
rm -rf /var/www/currency-exchange/frontend-dist
ENDSSH

# 6. Очистка
rm -rf "$TEMP_DIR"

echo "✅ Деплой завершен!"
echo ""
echo "📝 Следующие шаги:"
echo "1. Настройте .env файл: ssh $SERVER 'nano /var/www/currency-exchange/backend/.env'"
echo "2. Настройте Nginx (см. VPS_DEPLOY_GUIDE.md)"
echo "3. Установите SSL: certbot --nginx -d ваш-домен.com"
echo ""
echo "🔍 Проверка статуса:"
echo "ssh $SERVER 'pm2 status'"

