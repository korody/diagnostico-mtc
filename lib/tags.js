// lib/tags.js
// Utilities to manage multi-status tags for leads

function normalizeTag(tag) {
  return (tag || '').toString().trim().toLowerCase();
}

function mergeTags(existing, toAdd) {
  const set = new Set();
  (Array.isArray(existing) ? existing : (existing ? [existing] : [])).forEach(t => {
    const n = normalizeTag(t);
    if (n) set.add(n);
  });
  (Array.isArray(toAdd) ? toAdd : [toAdd]).forEach(t => {
    const n = normalizeTag(t);
    if (n) set.add(n);
  });
  return Array.from(set);
}

async function addLeadTags(supabase, leadId, tags) {
  try {
    if (!leadId || !tags || (Array.isArray(tags) && tags.length === 0)) return { skipped: true };
    const { data: lead, error: e1 } = await supabase
      .from('quiz_leads')
      .select('id, status_tags')
      .eq('id', leadId)
      .maybeSingle();
    if (e1) throw e1;

    const current = Array.isArray(lead?.status_tags) ? lead.status_tags : [];
    const updated = mergeTags(current, tags);

    const { error: e2 } = await supabase
      .from('quiz_leads')
      .update({ status_tags: updated, updated_at: new Date().toISOString() })
      .eq('id', leadId);

    if (e2) throw e2;
    return { success: true, updated };
  } catch (err) {
    // Graceful degradation if column doesn't exist or any other error
    console.log('⚠️ addLeadTags warning:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Verifica se um lead tem uma tag específica
 * @param {Array} statusTags - Array de tags do lead
 * @param {string} tag - Tag a verificar
 * @returns {boolean}
 */
function hasTag(statusTags, tag) {
  if (!Array.isArray(statusTags) || !tag) return false;
  const normalized = normalizeTag(tag);
  return statusTags.some(t => normalizeTag(t) === normalized);
}

/**
 * Verifica se um lead tem qualquer uma das tags fornecidas
 * @param {Array} statusTags - Array de tags do lead
 * @param {Array<string>} tags - Tags a verificar
 * @returns {boolean}
 */
function hasAnyTag(statusTags, tags) {
  if (!Array.isArray(statusTags) || !Array.isArray(tags)) return false;
  return tags.some(tag => hasTag(statusTags, tag));
}

/**
 * Remove uma tag de um array de tags
 * @param {Array} statusTags - Array de tags atual
 * @param {string} tag - Tag a remover
 * @returns {Array}
 */
function removeTag(statusTags, tag) {
  if (!Array.isArray(statusTags) || !tag) return statusTags || [];
  const normalized = normalizeTag(tag);
  return statusTags.filter(t => normalizeTag(t) !== normalized);
}

// Tags padronizadas do sistema
const TAGS = {
  // Quiz/Diagnóstico
  DIAGNOSTICO_FINALIZADO: 'diagnostico_finalizado',
  DIAGNOSTICO_ENVIADO: 'diagnostico_enviado',
  
  // Desafio/Referral
  DESAFIO_ENVIADO: 'desafio_enviado',
  
  // Áudio
  AUDIO_ENVIADO: 'audio_enviado',
  AUDIO_AUTOMACAO: 'audio_automacao',
  
  // Resultados
  RESULTADOS_ENVIADOS: 'resultados_enviados',
  
  // Template
  TEMPLATE_ENVIADO: 'template_enviado',
  
  // Erros
  FAILED: 'failed',
  DESAFIO_FAILED: 'desafio_failed'
};

module.exports = { 
  mergeTags, 
  addLeadTags, 
  normalizeTag,
  hasTag,
  hasAnyTag,
  removeTag,
  TAGS
};
