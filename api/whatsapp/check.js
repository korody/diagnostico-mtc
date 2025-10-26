// ========================================
// ENDPOINT: GET /api/whatsapp/check
// Verifica configuração do WhatsApp
// ========================================

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  // Proteção simples em produção via ADMIN_SECRET
  const adminSecret = process.env.ADMIN_SECRET;
  const provided = req.headers['x-admin-secret'];
  if (adminSecret && process.env.VERCEL_ENV === 'production') {
    if (!provided || provided !== adminSecret) {
      return res.status(404).json({ ok: false, error: 'Not Found' });
    }
  }

  const config = {
    UNNICHAT_API_URL: {
      presente: !!process.env.UNNICHAT_API_URL,
      valor: process.env.UNNICHAT_API_URL || '❌ NÃO CONFIGURADO'
    },
    UNNICHAT_ACCESS_TOKEN: {
      presente: !!process.env.UNNICHAT_ACCESS_TOKEN,
      valor: process.env.UNNICHAT_ACCESS_TOKEN 
        ? `${process.env.UNNICHAT_ACCESS_TOKEN.substring(0, 8)}...` 
        : '❌ NÃO CONFIGURADO'
    },
    UNNICHAT_INSTANCE_ID: {
      presente: !!process.env.UNNICHAT_INSTANCE_ID,
      valor: process.env.UNNICHAT_INSTANCE_ID || '(opcional)'
    }
  };

  const tudoOk = config.UNNICHAT_API_URL.presente && config.UNNICHAT_ACCESS_TOKEN.presente;

  res.status(200).json({
    ok: tudoOk,
    message: tudoOk 
      ? '✅ WhatsApp configurado corretamente' 
      : '⚠️  Variáveis de ambiente ausentes',
    config,
    instrucoes: !tudoOk ? {
      passo1: 'Acesse: Vercel → diagnostico-mtc-staging → Settings → Environment Variables',
      passo2: 'Adicione as variáveis ausentes',
      passo3: 'Redeploy ou aguarde próximo deploy automático'
    } : null
  });
};
