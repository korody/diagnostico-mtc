// api/utils/logger.js
const { createClient } = require('@supabase/supabase-js');

// HARDCODED para teste
const supabaseUrl = 'https://etbodugymxmrmbqfjigz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0Ym9kdWd5bXhtcm1icWZqaWd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5OTI4NzMsImV4cCI6MjA3NjU2ODg3M30.rXHsTPfZ8BwM_jEt_ERp7QVfBlYWgU8sFSbMvhWURAY';

const supabase = createClient(supabaseUrl, supabaseKey);

class Logger {
  static async logSend(leadId, phone, messageId, status, metadata = {}) {
    try {
      await supabase.from('whatsapp_logs').insert({
        lead_id: leadId,
        phone,
        message_id: messageId,
        status,
        metadata,
        sent_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erro ao registrar log:', error);
    }
  }

  static async logFailure(leadId, phone, errorMessage) {
    try {
      await supabase.from('whatsapp_logs').insert({
        lead_id: leadId,
        phone,
        status: 'failed',
        metadata: { error: errorMessage },
        sent_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erro ao registrar falha:', error);
    }
  }
}

module.exports = Logger;