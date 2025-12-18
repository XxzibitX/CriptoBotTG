import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

/**
 * Конфигурация Vite для сборки проекта
 * https://vitejs.dev/config/
 */
export default defineConfig({
  // Плагины: Vue для поддержки .vue файлов и DevTools для отладки
  plugins: [vue(), vueDevTools()],
  
  // Настройка алиасов (путей)
  resolve: {
    alias: {
      // '@' указывает на папку src для удобного импорта
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  
  // Настройки CSS
  css: {
    devSourcemap: true, // Включаем карту стилей для удобной отладки
  },
  
  // Настройки сборки (build)
  build: {
    cssCodeSplit: true, // Разделение CSS на чанки
    sourcemap: false,   // Отключаем sourcemap в продакшене для уменьшения размера
    minify: 'esbuild',  // Используем быстрый минификатор esbuild
    rollupOptions: {
      output: {
        // Настройка имен выходных файлов ассетов
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'assets/css/[name]-[hash][extname]'
          }
          return 'assets/[name]-[hash][extname]'
        }
      }
    }
  },
  
  // Базовый путь для развертывания
  base: '/',
})
