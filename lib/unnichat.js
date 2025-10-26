// ========================================
// UNNICHAT API CLIENT
// Funções para enviar mensagens via Unnichat/Meta
// ========================================

const UNNICHAT_API_URL = process.env.UNNICHAT_API_URL || 'https://unnichat.com.br/api';
const UNNICHAT_TOKEN = process.env.UNNICHAT_ACCESS_TOKEN;

/**
 * Envia mensagem de texto via Unnichat
 */
async function sendMessage(phone, messageText) {
  if (!UNNICHAT_TOKEN) {
    throw new Error('UNNICHAT_ACCESS_TOKEN não configurado');
  }

  if (!UNNICHAT_API_URL) {
    throw new Error('UNNICHAT_API_URL não configurado');
  }

  const response = await fetch(`${UNNICHAT_API_URL}/meta/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${UNNICHAT_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      phone,
      messageText
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Unnichat API error (${response.status}): ${errorText.substring(0, 100)}`);
  }

  const result = await response.json();

  if (result.code && result.code !== '200') {
    throw new Error(result.message || 'Erro ao enviar mensagem via Unnichat');
  }

  return result;
}

/**
 * Atualiza ou cria contato no Unnichat
 */
async function updateContact(name, phone, email, tags = []) {
  if (!UNNICHAT_TOKEN) {
    throw new Error('UNNICHAT_ACCESS_TOKEN não configurado');
  }

  const response = await fetch(`${UNNICHAT_API_URL}/contact`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${UNNICHAT_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name,
      phone,
      email,
      tags
    })
  });

  return await response.json();
}

module.exports = { sendMessage, updateContact };
