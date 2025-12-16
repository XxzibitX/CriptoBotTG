/**
 * Валидация имени
 */
export function validateName(name) {
  if (!name || name.trim().length < 2) {
    return 'Имя должно содержать минимум 2 символа'
  }
  if (name.trim().length > 100) {
    return 'Имя слишком длинное (максимум 100 символов)'
  }
  if (!/^[а-яА-ЯёЁa-zA-Z\s\-']+$/.test(name.trim())) {
    return 'Имя может содержать только буквы, пробелы, дефисы и апострофы'
  }
  return null
}

/**
 * Валидация телефона
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
 */
export function validateAgreement(agreement) {
  if (!agreement) {
    return 'Необходимо согласие на обработку персональных данных'
  }
  return null
}

/**
 * Валидация всей формы
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

