import { ref, onMounted } from 'vue'

/**
 * Composable для работы с Telegram Web App SDK
 */
export function useTelegram() {
  const isTelegram = ref(false)
  const webApp = ref(null)
  const user = ref(null)
  const initData = ref(null)

  onMounted(() => {
    // Проверяем, запущено ли приложение в Telegram
    if (window.Telegram && window.Telegram.WebApp) {
      isTelegram.value = true
      webApp.value = window.Telegram.WebApp
      
      // Инициализируем Web App
      webApp.value.ready()
      
      // Разворачиваем на весь экран
      webApp.value.expand()
      
      // Получаем данные пользователя
      user.value = webApp.value.initDataUnsafe?.user || null
      initData.value = webApp.value.initData || null
      
      // Настраиваем цветовую схему
      if (webApp.value.colorScheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark')
      }
      
      console.log('✅ Telegram Web App инициализирован', {
        user: user.value,
        version: webApp.value.version,
        platform: webApp.value.platform
      })
    } else {
      console.log('ℹ️ Приложение запущено вне Telegram')
      isTelegram.value = false
    }
  })

  /**
   * Отправить данные боту
   */
  function sendDataToBot(data) {
    if (!webApp.value) {
      console.warn('Telegram Web App не инициализирован')
      return false
    }
    
    try {
      webApp.value.sendData(JSON.stringify(data))
      return true
    } catch (error) {
      console.error('Ошибка при отправке данных боту:', error)
      return false
    }
  }

  /**
   * Закрыть приложение
   */
  function closeApp() {
    if (webApp.value) {
      webApp.value.close()
    }
  }

  /**
   * Показать главную кнопку
   */
  function showMainButton(text, onClick) {
    if (!webApp.value) return
    
    webApp.value.MainButton.setText(text)
    webApp.value.MainButton.onClick(onClick)
    webApp.value.MainButton.show()
  }

  /**
   * Скрыть главную кнопку
   */
  function hideMainButton() {
    if (webApp.value) {
      webApp.value.MainButton.hide()
    }
  }

  /**
   * Показать кнопку "Назад"
   */
  function showBackButton(onClick) {
    if (!webApp.value) return
    
    webApp.value.BackButton.onClick(onClick)
    webApp.value.BackButton.show()
  }

  /**
   * Скрыть кнопку "Назад"
   */
  function hideBackButton() {
    if (webApp.value) {
      webApp.value.BackButton.hide()
    }
  }

  /**
   * Показать всплывающее окно
   */
  function showAlert(message) {
    if (webApp.value) {
      webApp.value.showAlert(message)
    } else {
      alert(message)
    }
  }

  /**
   * Показать подтверждение
   */
  function showConfirm(message) {
    if (webApp.value) {
      return new Promise((resolve) => {
        webApp.value.showConfirm(message, (confirmed) => {
          resolve(confirmed)
        })
      })
    } else {
      return Promise.resolve(confirm(message))
    }
  }

  return {
    isTelegram,
    webApp,
    user,
    initData,
    sendDataToBot,
    closeApp,
    showMainButton,
    hideMainButton,
    showBackButton,
    hideBackButton,
    showAlert,
    showConfirm
  }
}

