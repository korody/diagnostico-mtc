// api/webhook/unnichat/diagnostico-unnichat.js
// Endpoint para retornar diagnóstico do lead para Unnichat, sem envio direto ao lead

const { normalizePhone } = require('../../../lib/phone');
const { calcularDiagnosticoCompleto } = require('../../../lib/diagnosticos');
const { addLeadTags } = require('../../../lib/tags');
const logger = require('../../../lib/logger');
const supabase = require('../../../lib/supabase'); // ✅ MUDANÇA CRÍTICA: Usar cliente compartilhado

module.exports = async (req, res) => {
  const reqId = logger && typeof logger.mkid === 'function' ? logger.mkid() : `req-${Date.now()}`;
  logger.info && logger.info(reqId, '🔔 Diagnostico-Unnichat recebido', { body: req.body });

  if (req.method !== 'POST') {
    logger.error && logger.error(reqId, 'Método não permitido', { method: req.method });
    return res.status(405).json({ success: false, error: 'Método não permitido' });
  }

  const { phone, name, email } = req.body;
  if (!phone) {
    logger.error && logger.error(reqId, '❌ ERRO: Telefone é obrigatório', { body: req.body });
    return res.status(400).json({ success: false, error: 'Telefone é obrigatório' });
  }

  try {
    // Busca robusta igual ver-resultados
    let lead = null;
    const phoneNormalized = normalizePhone(phone);
    logger.info && logger.info(reqId, '🔍 Telefone normalizado (sem DDI)', { raw: phone, normalized: phoneNormalized });
    
    // Montar candidatos para debug/auditoria
    const candidates = [];
    const digitsOnly = (phone || '').toString().replace(/\D/g, '');
    candidates.push(phoneNormalized);
    if (digitsOnly.startsWith('55')) {
      candidates.push(digitsOnly);
      if (!digitsOnly.startsWith('5511') && digitsOnly.length === 11) {
        candidates.push(digitsOnly.substring(2));
      }
    } else {
      candidates.push(`55${phoneNormalized}`);
    }
    if (phoneNormalized.length >= 10) candidates.push(phoneNormalized.slice(-10));
    if (phoneNormalized.length >= 9) candidates.push(phoneNormalized.slice(-9));
    if (phoneNormalized.length >= 8) candidates.push(phoneNormalized.slice(-8));
    const afterDd = phoneNormalized.replace(/^11/, '');
    if (/^99\d{6,9}/.test(afterDd)) {
      candidates.push(phoneNormalized.replace(/^99/, '9'));
    }
    const dedup = [...new Set(candidates.filter(Boolean))];
    logger.info && logger.info(reqId, '🔎 Candidates de telefone para debug', { raw: phone, normalized: phoneNormalized, candidates: dedup });

    // Tentativa 1: Busca exata
    logger.info && logger.info(reqId, '🔍 Tentativa 1: Busca exata por telefone', { phoneNormalized });
    const { data: leadExato } = await supabase
      .from('quiz_leads')
      .select('*')
      .eq('celular', phoneNormalized)
      .maybeSingle();
    if (leadExato) {
      lead = leadExato;
      logger.info && logger.info(reqId, '✅ Lead encontrado (busca exata)', { nome: lead.nome, id: lead.id });
    }

    // Tentativa 2: Últimos 10 dígitos (cobre casos com 9 extra em celulares)
    if (!lead && phoneNormalized.length >= 10) {
      const ultimos10 = phoneNormalized.slice(-10);
      logger.info && logger.info(reqId, '🔍 Tentativa 2: Busca pelos últimos 10 dígitos', { ultimos10 });
      const { data: leads10 } = await supabase
        .from('quiz_leads')
        .select('*')
        .ilike('celular', `%${ultimos10}%`)
        .limit(5);
      if (leads10 && leads10.length > 0) {
        lead = leads10[0];
        logger.info && logger.info(reqId, '✅ Lead encontrado (últimos 10 dígitos)', { nome: lead.nome, id: lead.id, matched: leads10.length });
      } else {
        logger.info && logger.info(reqId, '⚠️ Nenhum lead com últimos 10 dígitos', { ultimos10 });
      }
    }

    // Tentativa 3: Busca pelos últimos 9 dígitos (caso tenha DDI diferente ou erro)
    if (!lead && phoneNormalized.length >= 9) {
      const ultimos9 = phoneNormalized.slice(-9);
      logger.info && logger.info(reqId, '🔍 Tentativa 3: Busca pelos últimos 9 dígitos', { ultimos9 });
      const { data: leads9 } = await supabase
        .from('quiz_leads')
        .select('*')
        .ilike('celular', `%${ultimos9}%`)
        .limit(5);
      if (leads9 && leads9.length > 0) {
        lead = leads9[0];
        logger.info && logger.info(reqId, '✅ Lead encontrado (últimos 9 dígitos)', { nome: lead.nome, id: lead.id, matched: leads9.length });
      } else {
        logger.info && logger.info(reqId, '⚠️ Nenhum lead com últimos 9 dígitos', { ultimos9 });
      }
    }

    // Tentativa 4: Busca pelos últimos 8 dígitos (número fixo sem DDD ou celular antigo)
    if (!lead && phoneNormalized.length >= 8) {
      const ultimos8 = phoneNormalized.slice(-8);
      logger.info && logger.info(reqId, '🔍 Tentativa 4: Busca pelos últimos 8 dígitos', { ultimos8 });
      const { data: leads8 } = await supabase
        .from('quiz_leads')
        .select('*')
        .ilike('celular', `%${ultimos8}%`)
        .limit(5);
      if (leads8 && leads8.length > 0) {
        lead = leads8[0];
        logger.info && logger.info(reqId, '✅ Lead encontrado (últimos 8 dígitos)', { nome: lead.nome, id: lead.id, matched: leads8.length });
      } else {
        logger.info && logger.info(reqId, '⚠️ Nenhum lead com últimos 8 dígitos', { ultimos8 });
      }
    }

    // Tentativa 5: Heurística 9º dígito (compatibilidade celular antigo ↔ novo)
    // Quando temos 10 dígitos (DDD + 8), tentar também com 9 na frente (DDD + 9 + 8)
    if (!lead && phoneNormalized.length === 10) {
      const ddd = phoneNormalized.substring(0, 2);
      const numeroLocal = phoneNormalized.substring(2);
      
      // Se não começa com 9, tentar adicionar o 9
      if (!numeroLocal.startsWith('9')) {
        const comNove = `${ddd}9${numeroLocal}`;
        logger.info && logger.info(reqId, '🔍 Tentativa 5: Heurística 9º dígito - tentando com 9 na frente', { 
          original: phoneNormalized, 
          comNove 
        });
        
        const { data: leadCom9 } = await supabase
          .from('quiz_leads')
          .select('*')
          .eq('celular', comNove)
          .maybeSingle();
        
        if (leadCom9) {
          lead = leadCom9;
          logger.info && logger.info(reqId, '✅ Lead encontrado com 9º dígito adicionado!', { 
            nome: lead.nome, 
            id: lead.id,
            celularEncontrado: lead.celular,
            celularRecebido: phoneNormalized
          });
        } else {
          logger.info && logger.info(reqId, '⚠️ Não encontrado mesmo com 9º dígito', { comNove });
        }
      }
    }

    // Tentativa 6: Heurística inversa - tentar SEM o 9 quando temos 11 dígitos
    if (!lead && phoneNormalized.length === 11) {
      const ddd = phoneNormalized.substring(0, 2);
      const numeroLocal = phoneNormalized.substring(2);
      
      // Se começa com 9, tentar remover o 9
      if (numeroLocal.startsWith('9')) {
        const semNove = `${ddd}${numeroLocal.substring(1)}`;
        logger.info && logger.info(reqId, '🔍 Tentativa 6: Heurística 9º dígito - tentando sem o 9', { 
          original: phoneNormalized, 
          semNove 
        });
        
        const { data: leadSem9 } = await supabase
          .from('quiz_leads')
          .select('*')
          .eq('celular', semNove)
          .maybeSingle();
        
        if (leadSem9) {
          lead = leadSem9;
          logger.info && logger.info(reqId, '✅ Lead encontrado sem 9º dígito!', { 
            nome: lead.nome, 
            id: lead.id,
            celularEncontrado: lead.celular,
            celularRecebido: phoneNormalized
          });
        } else {
          logger.info && logger.info(reqId, '⚠️ Não encontrado mesmo sem 9º dígito', { semNove });
        }
      }
    }

    // Fallback por email
    if (!lead && email) {
      logger.info && logger.info(reqId, '🔍 Fallback: buscando por email', { email });
      const { data: leadByEmail } = await supabase
        .from('quiz_leads')
        .select('*')
        .eq('email', email)
        .maybeSingle();
      if (leadByEmail) {
        lead = leadByEmail;
        logger.info && logger.info(reqId, '✅ Lead encontrado por EMAIL', { nome: lead.nome, id: lead.id });
      }
    }

    if (!lead) {
      logger.error && logger.error(reqId, '❌ ERRO: Nenhum lead identificado!', { 
        phone, 
        phoneNormalized, 
        candidates: dedup,
        email,
        name,
        body: req.body 
      });
      return res.status(404).json({ success: false, error: 'Lead não encontrado' });
    }

    logger.info && logger.info(reqId, '✅ LEAD IDENTIFICADO', { 
      nome: lead.nome, 
      id: lead.id,
      celular: lead.celular, 
      elemento: lead.elemento_principal 
    });

    // Calcular/preparar diagnóstico
    let diagnostico = lead.diagnostico_completo;
    if (!diagnostico) {
      logger.info && logger.info(reqId, '🔧 Calculando diagnóstico (não estava no DB)', { leadId: lead.id });
      diagnostico = calcularDiagnosticoCompleto(lead);
    } else {
      logger.info && logger.info(reqId, '📋 Diagnóstico já existe no DB', { leadId: lead.id });
    }

    // Atualizar status, tags e registrar log
    logger.info && logger.info(reqId, '💾 Atualizando status do lead no banco', { leadId: lead.id });
    try {
      // Atualizar status do lead
      const { error: updateError } = await supabase
        .from('quiz_leads')
        .update({
          whatsapp_status: 'diagnostico_enviado',
          whatsapp_sent_at: new Date().toISOString()
        })
        .eq('id', lead.id);
      
      if (updateError) {
        logger.error && logger.error(reqId, '❌ Erro ao atualizar lead', updateError.message);
      } else {
        logger.info && logger.info(reqId, '✅ Status do lead atualizado', { leadId: lead.id });
      }
      
      // Adicionar tag
      try {
        await addLeadTags(supabase, lead.id, ['diagnostico_enviado']);
        logger.info && logger.info(reqId, '✅ Tag adicionada', { leadId: lead.id, tag: 'diagnostico_enviado' });
      } catch (tagErr) {
        logger.error && logger.error(reqId, '⚠️ Falha ao adicionar tag', tagErr.message);
      }
      
      // Registrar log
      const { error: logError } = await supabase.from('whatsapp_logs').insert({
        lead_id: lead.id,
        phone: lead.celular,
        status: 'diagnostico_enviado',
        metadata: {
          action: 'diagnostico-unnichat',
          triggered_by_webhook: true,
          webhook_payload: req.body
        },
        sent_at: new Date().toISOString()
      });
      
      if (logError) {
        logger.error && logger.error(reqId, '❌ Erro ao inserir whatsapp_logs', logError.message);
      } else {
        // Log VERCEL friendly igual ver-resultados
        logger.info && logger.info(reqId, '📃 DIAGNÓSTICO ENVIADO | whatsapp_logs inserido', { leadId: lead.id, nome: lead.nome });
      }
    } catch (e) {
      logger.error && logger.error(reqId, '❌ Erro geral ao atualizar status/tags/logs', { error: e.message, stack: e.stack });
    }

    logger.info && logger.info(reqId, '✅ Retornando diagnóstico para Unnichat', { leadId: lead.id, diagnosticoLength: diagnostico?.length || 0 });
    // Retornar apenas o campo 'diagnostico' para Unnichat
    return res.status(200).json({ diagnostico });
  } catch (err) {
    logger.error && logger.error(reqId, '❌ ERRO: Falha inesperada', { error: err.message, stack: err.stack });
    return res.status(500).json({ success: false, error: err.message });
  }
};