// ========================================
// GET /api/debug
// Mostra status das variáveis e módulos principais
// ========================================

module.exports = async (req, res) => {
  const out = { ok: true, checks: {} };
  try {
    const supabase = require('../lib/supabase');
    out.checks.supabase_client = !!supabase;
  } catch (e) {
    out.checks.supabase_client = false;
    out.checks.supabase_error = e.message;
  }

  try {
    const { normalizePhone } = require('../lib/phone');
    out.checks.phone_util = !!normalizePhone('11999999999');
  } catch (e) {
    out.checks.phone_util = false;
    out.checks.phone_error = e.message;
  }

  try {
    const { getDiagnosticos } = require('../lib/diagnosticos');
    const data = getDiagnosticos();
    out.checks.diag_loaded = !!data && typeof data === 'object';
  } catch (e) {
    out.checks.diag_loaded = false;
    out.checks.diag_error = e.message;
  }

  out.env = {
    SUPABASE_URL: !!(process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL),
    SUPABASE_KEY: !!(process.env.SUPABASE_KEY || process.env.REACT_APP_SUPABASE_KEY),
    UNNICHAT_ACCESS_TOKEN: !!process.env.UNNICHAT_ACCESS_TOKEN,
    UNNICHAT_API_URL: !!process.env.UNNICHAT_API_URL,
    NODE_ENV: process.env.NODE_ENV || null,
    VERCEL_ENV: process.env.VERCEL_ENV || null
  };

  res.setHeader('Content-Type', 'application/json');
  res.status(200).end(JSON.stringify(out));
};
