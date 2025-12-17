# Инструкция по деплою на Vercel

## Способ 1: Деплой через Vercel CLI (рекомендуется)

1. Установите Vercel CLI (если еще не установлен):
```bash
npm i -g vercel
```

2. Войдите в аккаунт Vercel:
```bash
vercel login
```

3. Перейдите в папку с собранным проектом:
```bash
cd frontend/frontend
```

4. Убедитесь, что папка `dist` содержит собранные файлы:
```bash
npm run build
```

5. Задеплойте папку `dist`:
```bash
vercel --prod dist
```

Или из корня проекта:
```bash
vercel --prod --cwd frontend/frontend dist
```

## Способ 2: Деплой через веб-интерфейс Vercel

1. Соберите проект локально:
```bash
cd frontend/frontend
npm run build
```

2. Зайдите на [vercel.com](https://vercel.com)
3. Создайте новый проект
4. Выберите "Import Git Repository" или "Deploy"
5. В настройках проекта:
   - **Root Directory**: `frontend/frontend`
   - **Build Command**: оставьте пустым или укажите `echo "No build needed"`
   - **Output Directory**: `dist`
   - **Install Command**: можно оставить пустым

6. Или загрузите папку `dist` через drag & drop в веб-интерфейсе

## Способ 3: Деплой через GitHub

1. Создайте `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Vercel
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Build
        run: |
          cd frontend/frontend
          npm install
          npm run build
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: frontend/frontend
          vercel-args: '--prod'
```

## Важно!

- Убедитесь, что папка `dist` содержит все необходимые файлы
- Файл `vercel.json` настроен на использование папки `dist` без сборки
- После деплоя проверьте, что сайт работает корректно

