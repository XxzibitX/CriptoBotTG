# 🚀 Деплой на Vercel

## 📋 Варианты деплоя

### Вариант 1: Frontend на Vercel + Backend отдельно (Рекомендуется)
- ✅ Frontend на Vercel (бесплатно, быстро)
- ✅ Backend на Railway/Render (проще для файлового хранилища)

### Вариант 2: Все на Vercel
- Frontend на Vercel
- Backend через Vercel Serverless Functions (требует переработки)

**Рекомендую Вариант 1** - он проще и не требует изменений в коде.

---

## 🎯 Вариант 1: Frontend на Vercel + Backend на Railway

### Шаг 1: Подготовка Frontend для Vercel

1. **Создайте файл `vercel.json` в корне проекта:**

```json
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/frontend/$1"
    }
  ]
}
```

2. **Обновите `frontend/vite.config.js` для правильного base path:**

```js
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig({
  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  base: process.env.NODE_ENV === 'production' ? '/' : '/',
})
```

3. **Создайте файл `frontend/vercel.json` (опционально, для SPA):**

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Шаг 2: Деплой Frontend на Vercel

#### Способ A: Через Vercel CLI (Рекомендуется)

1. **Установите Vercel CLI:**
```bash
npm i -g vercel
```

2. **Войдите в аккаунт:**
```bash
vercel login
```

3. **Перейдите в папку frontend:**
```bash
cd frontend
```

4. **Запустите деплой:**
```bash
vercel
```

5. **Следуйте инструкциям:**
   - Выберите проект (или создайте новый)
   - Подтвердите настройки
   - Дождитесь завершения деплоя

6. **Для production деплоя:**
```bash
vercel --prod
```

#### Способ B: Через GitHub (Автоматический деплой)

1. **Создайте репозиторий на GitHub** (если еще нет)

2. **Закоммитьте код:**
```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

3. **Зайдите на [vercel.com](https://vercel.com)**

4. **Нажмите "Add New Project"**

5. **Импортируйте репозиторий с GitHub**

6. **Настройте проект:**
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

7. **Добавьте переменные окружения:**
   - `VITE_API_URL` = URL вашего backend (например: `https://your-backend.railway.app`)

8. **Нажмите "Deploy"**

### Шаг 3: Деплой Backend на Railway

1. **Зайдите на [railway.app](https://railway.app)**

2. **Войдите через GitHub**

3. **Нажмите "New Project" → "Deploy from GitHub repo"**

4. **Выберите репозиторий и папку `backend`**

5. **Настройте переменные окружения:**
   - `PORT` = `3000` (Railway автоматически установит)
   - `HOST` = `0.0.0.0`
   - `RAPIRA_API_URL` = `https://api.rapira.net/open/market/rates`
   - `ORDERS_FILE` = `/app/data/orders.json`
   - `TELEGRAM_BOT_TOKEN` = ваш токен
   - `TELEGRAM_ADMIN_CHAT_ID` = ваш chat ID

6. **Railway автоматически задеплоит проект**

7. **Скопируйте URL вашего backend** (например: `https://your-app.railway.app`)

8. **Обновите `VITE_API_URL` в Vercel:**
   - Зайдите в настройки проекта на Vercel
   - Environment Variables
   - Обновите `VITE_API_URL` на URL вашего Railway backend
   - Передеплойте проект

### Шаг 4: Обновление Telegram Web App URL

1. **Откройте [@BotFather](https://t.me/BotFather)**

2. **Отправьте `/newapp` или `/setmenubutton`**

3. **Обновите Web App URL** на ваш Vercel URL:
   ```
   https://your-project.vercel.app
   ```

---

## 🎯 Вариант 2: Все на Vercel (Serverless Functions)

Этот вариант требует переработки backend для работы с serverless функциями.

### Шаг 1: Создание Serverless Functions

1. **Создайте папку `api` в корне проекта:**

```
CriptoBot/
├── api/
│   ├── rates.js
│   ├── orders.js
│   └── telegram.js
├── frontend/
└── vercel.json
```

2. **Пример `api/rates.js`:**

```javascript
const fetch = require('node-fetch')

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    const response = await fetch('https://api.rapira.net/open/market/rates')
    const data = await response.json()
    
    // ... обработка данных ...
    
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
}
```

3. **Обновите `vercel.json`:**

```json
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    },
    {
      "src": "api/**/*.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/frontend/$1"
    }
  ]
}
```

**⚠️ Проблема:** Файловое хранилище (`data/orders.json`) не будет работать в serverless окружении. Нужно использовать базу данных (например, Vercel Postgres, MongoDB Atlas, или Supabase).

---

## 🔧 Настройка переменных окружения

### В Vercel Dashboard:

1. Зайдите в настройки проекта
2. Environment Variables
3. Добавьте:
   - `VITE_API_URL` = URL вашего backend

### Для Production:

- Используйте Production environment
- Убедитесь, что все переменные добавлены

---

## 📝 Проверка после деплоя

1. **Откройте ваш Vercel URL**
2. **Проверьте, что frontend загружается**
3. **Проверьте консоль браузера на ошибки**
4. **Проверьте, что API запросы идут на правильный backend URL**
5. **Протестируйте отправку заявки**
6. **Проверьте, что администратор получил сообщение в Telegram**

---

## 🐛 Устранение проблем

### Проблема: 404 на всех страницах

**Решение:** Добавьте `vercel.json` с rewrites для SPA:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Проблема: CORS ошибки

**Решение:** 
- Убедитесь, что `VITE_API_URL` указывает на правильный backend
- Проверьте CORS настройки в backend

### Проблема: Переменные окружения не работают

**Решение:**
- Переменные должны начинаться с `VITE_` для Vite
- После изменения переменных нужно передеплоить проект

### Проблема: Build fails

**Решение:**
- Проверьте, что все зависимости в `package.json`
- Убедитесь, что Node.js версия совместима
- Проверьте логи билда в Vercel Dashboard

---

## 🚀 Автоматический деплой

После настройки через GitHub, каждый push в `main` ветку будет автоматически деплоить проект на Vercel.

---

## 📚 Полезные ссылки

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Railway Documentation](https://docs.railway.app/)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

---

## 💡 Рекомендации

1. **Используйте Вариант 1** (Frontend на Vercel + Backend на Railway)
   - Проще настроить
   - Не требует изменений в коде
   - Файловое хранилище работает нормально

2. **Настройте кастомный домен** (опционально):
   - В Vercel можно добавить свой домен
   - Это улучшит SEO и выглядит профессиональнее

3. **Используйте HTTPS:**
   - Vercel автоматически предоставляет SSL сертификат
   - Обязательно для Telegram Web Apps

4. **Мониторинг:**
   - Используйте Vercel Analytics для отслеживания производительности
   - Настройте алерты на ошибки

