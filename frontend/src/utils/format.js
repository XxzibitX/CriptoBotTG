/**
 * Форматирование телефона в формат +7 (999) 123-45-67
 */
export function formatPhone(value) {
  // Убираем все нецифровые символы
  let cleaned = value.replace(/\D/g, '')
  
  // Если начинается с 8, заменяем на 7
  if (cleaned.startsWith('8')) {
    cleaned = '7' + cleaned.slice(1)
  }
  
  // Если не начинается с 7, добавляем
  if (!cleaned.startsWith('7') && cleaned.length > 0) {
    cleaned = '7' + cleaned
  }
  
  // Ограничиваем длину (11 цифр: 7 + 10)
  cleaned = cleaned.slice(0, 11)
  
  // Форматируем
  if (cleaned.length === 0) {
    return ''
  } else if (cleaned.length <= 1) {
    return `+${cleaned}`
  } else if (cleaned.length <= 4) {
    return `+${cleaned.slice(0, 1)} (${cleaned.slice(1)}`
  } else if (cleaned.length <= 7) {
    return `+${cleaned.slice(0, 1)} (${cleaned.slice(1, 4)}) ${cleaned.slice(4)}`
  } else if (cleaned.length <= 9) {
    return `+${cleaned.slice(0, 1)} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
  } else {
    return `+${cleaned.slice(0, 1)} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7, 9)}-${cleaned.slice(9)}`
  }
}

/**
 * Форматирование суммы с разделителями тысяч
 */
export function formatAmount(value) {
  if (!value && value !== 0) return ''
  
  // Убираем все кроме цифр и точки
  let cleaned = value.toString().replace(/[^\d.]/g, '')
  
  // Разделяем на целую и дробную части
  const parts = cleaned.split('.')
  let integerPart = parts[0] || ''
  const decimalPart = parts[1] || ''
  
  // Ограничиваем дробную часть до 2 знаков
  const limitedDecimal = decimalPart.slice(0, 2)
  
  // Добавляем разделители тысяч
  integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  
  // Собираем обратно
  if (limitedDecimal) {
    return `${integerPart}.${limitedDecimal}`
  }
  
  return integerPart
}

/**
 * Парсинг отформатированной суммы обратно в число
 */
export function parseAmount(formattedValue) {
  if (!formattedValue) return null
  
  // Убираем все кроме цифр и точки
  const cleaned = formattedValue.replace(/[^\d.]/g, '')
  
  if (!cleaned) return null
  
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

