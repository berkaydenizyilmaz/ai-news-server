/**
 * Core Utilities Module
 * 
 * Uygulama genelinde kullanılan yardımcı fonksiyonları içerir.
 * 
 */

/**
 * Generate URL-friendly Slug
 * 
 * Verilen metni URL-dostu bir formata dönüştürür.
 * Türkçe karakterleri, boşlukları ve özel karakterleri temizler.
 * 
 * @param text - Dönüştürülecek metin
 * @returns {string} URL-dostu slug
 */
export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

/**
 * Format Date to Turkish Locale
 * 
 * Tarihi Türkçe formatında biçimlendirir.
 * Gün, ay, yıl ve saat bilgilerini içerir.
 * 
 * @param date - Biçimlendirilecek tarih
 * @returns {string} Biçimlendirilmiş tarih string'i
 */
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

/**
 * Truncate Text
 * 
 * Uzun metinleri belirli bir uzunlukta keser ve sonuna ... ekler.
 * 
 * @param text - Kesilecek metin
 * @param maxLength - Maksimum karakter sayısı
 * @returns {string} Kesilmiş metin
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

/**
 * Validate Email Format
 * 
 * Email adresinin geçerli formatta olup olmadığını kontrol eder.
 * 
 * @param email - Kontrol edilecek email adresi
 * @returns {boolean} Email geçerli mi?
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Generate Random String
 * 
 * Belirtilen uzunlukta rastgele bir string üretir.
 * Harf ve rakamlardan oluşan güvenli bir string döndürür.
 * 
 * @param length - Üretilecek string'in uzunluğu
 * @returns {string} Rastgele üretilmiş string
 */
export const generateRandomString = (length: number): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}; 