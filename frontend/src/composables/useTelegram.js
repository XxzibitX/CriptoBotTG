import { ref, onMounted } from 'vue'

/**
 * Composable для работы с Telegram Web App SDK
 * Предоставляет реактивные данные и методы для взаимодействия с Telegram
 * @returns {Object} Объект с данными и методами Telegram Web App
 */
export function useTelegram() {
  // Состояния
  const isTelegram = ref(false) // Запущено ли приложение внутри Telegram
  const webApp = ref(null)      // Объект Telegram.WebApp
  const user = ref(null)        // Данные пользователя (id, username и т.д.)
  const initData = ref(null)    // Строка инициализации для валидации на бэкенде

  onMounted(() => {
    // Проверяем, запущено ли приложение в Telegram
    // window.Telegram.WebApp доступен только внутри Telegram клиента
    if (window.Telegram && window.Telegram.WebApp) {
      isTelegram.value = true
      webApp.value = window.Telegram.WebApp
      
      // Инициализируем Web App (сообщаем Telegram, что приложение готово)
      webApp.value.ready()
      
      // Разворачиваем на весь экран (полезно для мобильных)
      webApp.value.expand()
      
      // Получаем данные пользователя
      // initDataUnsafe содержит невалидированные данные, initData - подписанную строку
      user.value = webApp.value.initDataUnsafe?.user || null
      initData.value = webApp.value.initData || null
      
      // Настраиваем цветовую схему приложения в соответствии с темой Telegram
      if (webApp.value.colorScheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark')
      }
      
    } else {
      isTelegram.value = false
    }
  })

  /**
   * Отправить данные боту
   * Бот получит сообщение с данными (web_app_data)
   * @param {Object} data - Данные для отправки
   * @returns {boolean} - Успешно ли отправлено
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
   * Закрыть приложение Web App
   */
  function closeApp() {
    if (webApp.value) {
      webApp.value.close()
    }
  }

  /**
   * Показать главную кнопку (внизу экрана)
   * @param {string} text - Текст кнопки
   * @param {Function} onClick - Обработчик нажатия
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
   * Показать кнопку "Назад" (в заголовке)
   * @param {Function} onClick - Обработчик нажатия
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
   * Показать нативное всплывающее окно
   * @param {string} message - Текст сообщения
   */
  function showAlert(message) {
    if (webApp.value) {
      webApp.value.showAlert(message)
    } else {
      alert(message)
    }
  }

  /**
   * Показать нативное окно подтверждения
   * @param {string} message - Текст вопроса
   * @returns {Promise<boolean>} - Результат выбора (true/false)
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

