/**
 * Валидация имени и фамилии
 * @param {string} name - Имя и фамилия
 * @returns {string|null} - Сообщение об ошибке или null
 */
export function validateName(name) {
  if (!name || !name.trim()) {
    return 'Введите ваше имя и фамилию'
  }
  
  const trimmedName = name.trim()
  
  // Проверяем минимальную длину
  if (trimmedName.length < 2) {
    return 'Имя должно содержать минимум 2 символа'
  }
  
  // Проверяем максимальную длину
  if (trimmedName.length > 100) {
    return 'Имя слишком длинное (максимум 100 символов)'
  }
  
  // Проверяем, что есть и имя, и фамилия (минимум 2 слова)
  const nameParts = trimmedName.split(/\s+/).filter(part => part.length > 0)
  if (nameParts.length < 2) {
    return 'Введите имя и фамилию (минимум 2 слова)'
  }
  
  // Проверяем, что каждое слово содержит только буквы, дефисы и апострофы
  const namePattern = /^[а-яА-ЯёЁa-zA-Z\-']+$/
  for (const part of nameParts) {
    if (!namePattern.test(part)) {
      return 'Имя и фамилия могут содержать только буквы, дефисы и апострофы'
    }
  }
  
  // Проверяем минимальную длину каждого слова
  for (const part of nameParts) {
    if (part.length < 2) {
      return 'Каждое слово (имя и фамилия) должно содержать минимум 2 символа'
    }
  }
  
  return null
}

/**
 * Валидация телефона
 * @param {string} phone - Номер телефона
 * @returns {string|null} - Сообщение об ошибке или null
 */
export function validatePhone(phone) {
  if (!phone) {
    return 'Телефон обязателен для заполнения'
  }
  
  // Убираем все нецифровые символы кроме +
  const cleaned = phone.replace(/[^\d+]/g, '')
  
  // Проверяем российский формат: +7XXXXXXXXXX или 7XXXXXXXXXX
  if (!/^\+?7\d{10}$/.test(cleaned)) {
    return 'Введите корректный номер телефона (например: +7 999 123-45-67)'
  }
  
  return null
}

/**
 * Валидация суммы
 * @param {string|number} amount - Сумма обмена
 * @returns {string|null} - Сообщение об ошибке или null
 */
export function validateAmount(amount) {
  if (!amount || amount === null || amount === undefined) {
    return 'Укажите сумму для обмена'
  }
  
  const numAmount = Number(amount)
  
  if (isNaN(numAmount) || numAmount <= 0) {
    return 'Сумма должна быть больше 0'
  }
  
  if (numAmount < 1) {
    return 'Минимальная сумма: 1 USDT'
  }
  
  if (numAmount > 10000) {
    return 'Максимальная сумма: 10,000 USDT'
  }
  
  // Проверяем, что не более 2 знаков после запятой
  const decimals = (amount.toString().split('.')[1] || '').length
  if (decimals > 2) {
    return 'Максимум 2 знака после запятой'
  }
  
  return null
}

/**
 * Валидация способа оплаты
 * @param {string} method - Код способа оплаты
 * @returns {string|null} - Сообщение об ошибке или null
 */
export function validatePaymentMethod(method) {
  if (!method) {
    return 'Выберите способ оплаты'
  }
  
  const validMethods = ['bank_card', 'sberbank', 'tinkoff', 'yoomoney', 'qiwi']
  if (!validMethods.includes(method)) {
    return 'Некорректный способ оплаты'
  }
  
  return null
}

/**
 * Валидация согласия
 * @param {boolean} agreement - Флаг согласия
 * @returns {string|null} - Сообщение об ошибке или null
 */
export function validateAgreement(agreement) {
  if (!agreement) {
    return 'Необходимо согласие на обработку персональных данных'
  }
  return null
}

/**
 * Валидация всей формы
 * @param {Object} formData - Объект с данными формы
 * @returns {Object} - Результат валидации { isValid, errors }
 */
export function validateForm(formData) {
  const errors = {}
  
  const nameError = validateName(formData.name)
  if (nameError) errors.name = nameError
  
  const phoneError = validatePhone(formData.phone)
  if (phoneError) errors.phone = phoneError
  
  const amountError = validateAmount(formData.amount)
  if (amountError) errors.amount = amountError
  
  const paymentError = validatePaymentMethod(formData.paymentMethod)
  if (paymentError) errors.paymentMethod = paymentError
  
  const agreementError = validateAgreement(formData.agreement)
  if (agreementError) errors.agreement = agreementError
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

