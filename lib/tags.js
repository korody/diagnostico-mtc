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

module.exports = { mergeTags, addLeadTags, normalizeTag };
