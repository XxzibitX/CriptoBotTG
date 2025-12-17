import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  css: {
    // Включаем sourcemaps для CSS в dev и production
    devSourcemap: true,
    // Настройки для обработки CSS
    postcss: {
      // PostCSS будет автоматически использовать конфигурацию из package.json или postcss.config.js
    }
  },
  build: {
    // Настройки для production сборки
    cssCodeSplit: true, // Разделение CSS на отдельные файлы для лучшего кэширования
    sourcemap: false, // Отключаем sourcemaps в production для уменьшения размера
    minify: 'esbuild', // Используем esbuild для минификации (быстрее чем terser)
    // Настройки для оптимизации
    rollupOptions: {
      output: {
        // Убеждаемся, что CSS файлы имеют правильные имена
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'assets/css/[name]-[hash][extname]'
          }
          return 'assets/[name]-[hash][extname]'
        }
      }
    }
  },
  // Базовый путь для production (если приложение не в корне)
  base: '/',
})
