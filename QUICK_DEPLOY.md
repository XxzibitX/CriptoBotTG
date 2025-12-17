# ⚡ Быстрый деплой на VPS

## 🎯 Что было сделано для подготовки:

✅ Проект готов к деплою:
- Backend настроен для работы на порту 3000
- Frontend автоматически определяет API URL (не нужно менять вручную)
- Созданы все необходимые конфигурационные файлы

## 📋 Быстрый старт (5 минут)

### 1. Подключитесь к VPS
```bash
ssh root@ВАШ_IP_АДРЕС
```

### 2. Установите необходимое ПО
```bash
# Обновление системы
apt update && apt upgrade -y

# Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Nginx
apt install -y nginx

# PM2
npm install -g pm2
pm2 startup

# Certbot (для SSL)
apt install -y certbot python3-certbot-nginx
```

### 3. Создайте структуру папок
```bash
mkdir -p /var/www/currency-exchange/CriptoBotTG
cd /var/www/currency-exchange/CriptoBotTG
```

### 4. Загрузите проект

**Вариант А: Через скрипт (с вашего компьютера)**
```bash
cd /Users/a1111/Documents/Front-End/CriptoBotTG
./deploy.sh root@ВАШ_IP
```

**Вариант Б: Вручную**
```bash
# На вашем компьютере
cd /Users/a1111/Documents/Front-End/CriptoBotTG
scp -r backend root@ВАШ_IP:/var/www/currency-exchange/CriptoBotTG/
scp -r frontend/dist root@ВАШ_IP:/var/www/currency-exchange/CriptoBotTG/public/
```

### 5. Настройте Backend
```bash
ssh root@ВАШ_IP
cd /var/www/currency-exchange/CriptoBotTG/backend
npm install --production

# Создайте .env файл
nano .env
```

Вставьте:
```env
PORT=3000
RAPIRA_API_URL=https://api.rapira.net/open/market/rates
ORDERS_FILE=/var/www/currency-exchange/CriptoBotTG/backend/data/orders.json
TELEGRAM_BOT_TOKEN=ваш_токен
TELEGRAM_ADMIN_CHAT_ID=ваш_chat_id
NODE_ENV=production
```

```bash
# Создайте папку для данных
mkdir -p data
chmod 755 data

# Запустите через PM2
pm2 start proxy.js --name "currency-backend"
pm2 save
```

### 6. Настройте Nginx
```bash
# Скопируйте конфигурацию
nano /etc/nginx/sites-available/currency-exchange
```

Скопируйте содержимое из `nginx-config.conf` (замените `ваш-домен.com` на ваш домен/IP)

```bash
# Активируйте
ln -s /etc/nginx/sites-available/currency-exchange /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

### 7. Настройте Firewall
```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

### 8. Установите SSL (если есть домен)
```bash
certbot --nginx -d ваш-домен.com -d www.ваш-домен.com
```

## ✅ Готово!

Откройте в браузере: `http://ВАШ_IP` или `https://ваш-домен.com`

## 📚 Подробная инструкция

Смотрите полное руководство в файле **VPS_DEPLOY_GUIDE.md**

## 🔍 Проверка работы

```bash
# Проверка Backend
pm2 status
curl http://localhost:3000/api/health

# Проверка Frontend
curl http://localhost/

# Проверка логов
pm2 logs currency-backend
tail -f /var/log/nginx/currency-exchange-error.log
```

## 🆘 Проблемы?

1. **Backend не запускается**: `pm2 logs currency-backend`
2. **502 ошибка**: Проверьте, что Backend запущен: `pm2 status`
3. **Frontend не загружается**: Проверьте права: `chmod -R 755 /var/www/currency-exchange/CriptoBotTG/public`

