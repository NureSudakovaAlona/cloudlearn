/**
 * Функція для валідації email адреси
 * @param email Рядок з email адресою для перевірки
 * @returns true якщо email валідний, false якщо ні
 */
export const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };
  
  /**
   * Функція для валідації номера телефону
   * @param phone Рядок з номером телефону для перевірки
   * @returns true якщо номер валідний, false якщо ні
   */
  export const validatePhone = (phone: string): boolean => {
    return /^\+[0-9]{10,15}$/.test(phone);
  };
  
  /**
   * Функція для валідації пароля
   * @param password Рядок з паролем для перевірки
   * @returns true якщо пароль відповідає вимогам, false якщо ні
   */
  export const validatePassword = (password: string): boolean => {
    // Мінімум 8 символів, хоча б одна літера і одна цифра
    return password.length >= 8 && /[A-Za-z]/.test(password) && /[0-9]/.test(password);
  };