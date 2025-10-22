// api/utils/phone.js

/**
 * Normaliza número de telefone para o formato padrão brasileiro
 * Remove todos os caracteres não numéricos e garante formato consistente
 * 
 * @param {string} phone - Número de telefone em qualquer formato
 * @returns {string} - Telefone no formato: apenas números sem código do país (ex: "11998457676")
 */
function normalizePhone(phone) {
  if (!phone) return '';
  
  // Remove tudo que não é número
  let clean = phone.replace(/\D/g, '');
  
  // Remove código do país 55 se existir
  if (clean.startsWith('55') && clean.length >= 12) {
    clean = clean.substring(2);
  }
  
  // Remove 0 na frente do DDD se existir (011 -> 11)
  if (clean.startsWith('0') && clean.length === 11) {
    clean = clean.substring(1);
  }
  
  return clean;
}

/**
 * Formata telefone para usar na API do Unnichat (com código do país)
 * 
 * @param {string} phone - Número de telefone
 * @returns {string} - Telefone com código do país (ex: "5511998457676")
 */
function formatPhoneForUnnichat(phone) {
  const normalized = normalizePhone(phone);
  
  // Adiciona código do país se não tiver
  if (!normalized.startsWith('55')) {
    return `55${normalized}`;
  }
  
  return normalized;
}

/**
 * Valida se o telefone brasileiro é válido
 * 
 * @param {string} phone - Número de telefone
 * @returns {boolean} - true se válido
 */
function isValidBrazilianPhone(phone) {
  const normalized = normalizePhone(phone);
  
  // Deve ter 10 ou 11 dígitos (DDD + número)
  // 10 dígitos: fixo (XX) XXXX-XXXX
  // 11 dígitos: celular (XX) 9XXXX-XXXX
  return normalized.length === 10 || normalized.length === 11;
}

/**
 * Formata telefone para exibição
 * 
 * @param {string} phone - Número de telefone
 * @returns {string} - Telefone formatado (ex: "(11) 99845-7676")
 */
function formatPhoneForDisplay(phone) {
  const normalized = normalizePhone(phone);
  
  if (normalized.length === 11) {
    // Celular: (XX) 9XXXX-XXXX
    return `(${normalized.substring(0, 2)}) ${normalized.substring(2, 7)}-${normalized.substring(7)}`;
  } else if (normalized.length === 10) {
    // Fixo: (XX) XXXX-XXXX
    return `(${normalized.substring(0, 2)}) ${normalized.substring(2, 6)}-${normalized.substring(6)}`;
  }
  
  return phone;
}

module.exports = {
  normalizePhone,
  formatPhoneForUnnichat,
  isValidBrazilianPhone,
  formatPhoneForDisplay
};