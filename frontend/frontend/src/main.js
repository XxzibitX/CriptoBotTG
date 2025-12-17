/* ============================================
   CSS Import Order (критически важно для production):
   1. Reset (сброс стилей браузера)
   2. Base (базовые стили и переменные)
   3. Main (глобальные стили приложения)
   ============================================ */
import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)
app.mount('#app')
