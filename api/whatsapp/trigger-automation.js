
const { formatForUnnichat, findLeadByPhone } = require('../../lib/phone-simple');
const supabase = require('../../lib/supabase');

module.exports = async function triggerAutomationHandler(req, res) {
  try {
    const GATILHO_URL = process.env.DIAGNOSTICO_AUTOMACAO_UNNICHAT || process.env.UNNICHAT_GATILHO_URL || process.env.UNNICHAT_GATILHO || process.env.UNNICHAT_API_URL;

    if (!GATILHO_URL) {
      return res.status(500).json({ success: false, error: 'DIAGNOSTICO_AUTOMACAO_UNNICHAT não configurado' });
    }

    const { leadId, phone } = req.body || {};

    let lead = null;

    if (leadId) {
      const { data, error } = await supabase.from('quiz_leads').select('*').eq('id', leadId).maybeSingle();
      if (error) throw error;
      lead = data;
    }

    if (!lead && phone) {
      // Buscar por telefone usando função simplificada
      lead = await findLeadByPhone(supabase, phone, null);
    }

    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead não encontrado' });
    }

    const phoneForUnnichat = formatForUnnichat(lead.celular || '');

    const payload = {
      name: lead.nome || 'Contato',
      email: lead.email || `${lead.celular.replace('+', '')}@placeholder.com`,
      phone: phoneForUnnichat
    };

    // Enviar para o gatilho
    const resp = await fetch(GATILHO_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    let body;
    try { body = await resp.json(); } catch (_) { body = await resp.text(); }

    // Determinar sucesso de forma permissiva (same as script)
    const ok = resp.ok || (body && (body.success === true || body.response !== false));

    if (ok) {
      // Atualizar status no banco (não obrigatório)
      try {
        await supabase.from('quiz_leads').update({ whatsapp_status: 'template_enviado', whatsapp_sent_at: new Date().toISOString() }).eq('id', lead.id);
      } catch (e) { /* noop */ }

      try {
        await supabase.from('whatsapp_logs').insert({
          lead_id: lead.id,
          phone: lead.celular,
          status: 'template_enviado',
          metadata: { gatilho_response: body, manual_send: true, script: 'api/whatsapp/trigger-automation' },
          sent_at: new Date().toISOString()
        });
      } catch (e) { /* noop */ }

      return res.json({ success: true, message: 'Gatilho acionado', response: body });
    }

    // Falha ao acionar gatilho
    try {
      await supabase.from('quiz_leads').update({ whatsapp_status: 'failed', whatsapp_error: JSON.stringify(body || resp.statusText) }).eq('id', lead.id);
    } catch (e) { /* noop */ }

    return res.status(500).json({ success: false, error: 'Falha ao acionar gatilho', reason: body });

  } catch (error) {
    console.error('❌ trigger-automation error:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};
