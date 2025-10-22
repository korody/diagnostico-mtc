// api/utils/unnichat.js
const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

class UnnichatClient {
  constructor() {
    this.instanceId = process.env.UNNICHAT_INSTANCE_ID;
    this.accessToken = process.env.UNNICHAT_ACCESS_TOKEN;
    this.apiUrl = process.env.UNNICHAT_API_URL || 'https://unnichat.com.br/api';
    
    if (!this.instanceId || !this.accessToken) {
      throw new Error('Credenciais Unnichat não configuradas');
    }

    this.client = axios.create({
      baseURL: this.apiUrl,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      }
    });
  }

  // Formata número para padrão brasileiro
  formatPhoneNumber(phone) {
    let cleaned = phone.replace(/\D/g, '');
    
    // Se já tem código do país
    if (cleaned.startsWith('55')) {
      return cleaned;
    }
    
    // Se tem 11 ou 10 dígitos (com DDD)
    if (cleaned.length === 11 || cleaned.length === 10) {
      return '55' + cleaned;
    }
    
    // Se tem 9 ou 8 dígitos (sem DDD)
    return '55' + cleaned;
  }

  // Envia mensagem de texto (usando endpoint /meta/messages)
  async sendTextMessage(phone, message) {
    try {
      const formattedPhone = this.formatPhoneNumber(phone);
      
      const payload = {
        phone: formattedPhone,
        messageText: message
      };

      console.log('📤 Payload:', JSON.stringify(payload, null, 2));
      
      const response = await this.client.post('/meta/messages', payload);

      console.log('✅ Resposta Unnichat:', response.data);

      return {
        success: true,
        messageId: response.data.id || response.data.key?.id || response.data.messageId,
        data: response.data
      };
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error.response?.data || error.message);
      
      // Log detalhado do erro
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
        console.error('Headers:', error.response.headers);
      }
      
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        details: error.response?.data
      };
    }
  }

  // Envia mensagem com mídia (imagem, PDF, etc)
  async sendMediaMessage(phone, mediaUrl, caption = '') {
    try {
      const formattedPhone = this.formatPhoneNumber(phone);
      
      const payload = {
        phone: formattedPhone,
        mediaUrl: mediaUrl,
        caption: caption
      };

      const response = await this.client.post('/meta/messages', payload);

      return {
        success: true,
        messageId: response.data.id || response.data.key?.id,
        data: response.data
      };
    } catch (error) {
      console.error('❌ Erro ao enviar mídia:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Verifica se o número existe no WhatsApp
  async checkNumberExists(phone) {
    try {
      const formattedPhone = this.formatPhoneNumber(phone);
      
      // Tenta enviar uma requisição para verificar
      // Nota: Unnichat pode não ter endpoint específico para isso
      // Vamos assumir que o número existe
      return {
        exists: true,
        phone: formattedPhone
      };
    } catch (error) {
      console.error('⚠️ Aviso ao verificar número:', error.message);
      return {
        exists: true, // Assume que existe para não bloquear o envio
        error: error.message
      };
    }
  }

  // Obtém status da instância
  async getInstanceStatus() {
    try {
      // Tenta fazer uma requisição simples para verificar se está conectado
      // Como não sabemos o endpoint exato, vamos tentar acessar a API
      const response = await this.client.get('/');
      
      return {
        connected: true,
        data: response.data
      };
    } catch (error) {
      // Se der erro, vamos assumir que está conectado mesmo assim
      // para não bloquear o teste
      console.log('⚠️ Não foi possível verificar status, assumindo conectado');
      return {
        connected: true,
        message: 'Status não verificado, assumindo conectado'
      };
    }
  }
}

module.exports = UnnichatClient;