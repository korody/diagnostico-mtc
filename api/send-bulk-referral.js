import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const UNNICHAT_API_URL = 'https://api.unnichat.com/v1';
const UNNICHAT_API_KEY = process.env.UNNICHAT_API_KEY;
const INSTANCE_ID = process.env.UNNICHAT_INSTANCE_ID;

// Rate limiting
const DELAY_BETWEEN_MESSAGES = 2000; // 2 segundos entre cada mensagem
const DELAY_BETWEEN_LEADS = 3000; // 3 segundos entre leads (2 mensagens + pausa)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { mode = 'test', limit = 10, offset = 0, specific_phone = null } = req.body;

  try {
    console.log(`[Bulk Referral] Iniciando envio em modo: ${mode}`);
    
    // Buscar leads
    let query = supabase
      .from('leads')
      .select('id, nome, telefone, email, created_at')
      .not('telefone', 'is', null);

    // Se tiver telefone específico, buscar só ele
    if (specific_phone) {
      query = query.eq('telefone', specific_phone);
      console.log(`[Bulk Referral] Buscando telefone específico: ${specific_phone}`);
    } else {
      query = query.order('created_at', { ascending: false });
      
      if (mode === 'test') {
        query = query.limit(limit);
      } else {
        query = query.range(offset, offset + limit - 1);
      }
    }

    const { data: leads, error: fetchError } = await query;

    if (fetchError) {
      throw new Error(`Erro ao buscar leads: ${fetchError.message}`);
    }

    console.log(`[Bulk Referral] ${leads.length} leads encontrados`);

    const results = {
      total: leads.length,
      success: 0,
      failed: 0,
      errors: [],
      messages_sent: 0
    };

    // Enviar mensagens com delay
    for (const lead of leads) {
      try {
        const referralLink = `https://curso.qigongbrasil.com/lead/bny-convite-wpp?utm_campaign=BNY2&utm_source=org&utm_medium=whatsapp&utm_public=${lead.telefone}&utm_content=convite-desafio`;
        
        // MENSAGEM 1: Apresentação do Desafio
        const message1 = `*Já pensou em ganhar um Pacote Vitalício do Mestre Ye?*

O *Mestre Ye* preparou algo muito especial para você: o *Desafio da Vitalidade*, parte da *Black November da Saúde Vitalícia*.

Durante as próximas semanas, você vai receber *missões simples e poderosas* de *Qi Gong, Tui Na e Respiração**, para começar a restaurar seu corpo e sua energia, **mesmo antes do evento principal.*

Cada missão vai te aproximar mais do *equilíbrio, da leveza e da vitalidade que o seu corpo merece.*

E quem completar todas as etapas ainda concorre ao *Pacote Vitalício do Mestre Ye!* 🀄

*Como participar:*

1. Compartilhe suas missões no Instagram Stories e marque *@mestre_ye*;
2. Convide muitos amigos e familiares para o evento e aumente suas chances de ganhar o grande prêmio!`;

        // MENSAGEM 2: Link de compartilhamento
        const message2 = `*Você agora faz parte do Desafio da Vitalidade!*

Para aumentar suas chances de ganhar o *Pacote Vitalício do Mestre Ye*, compartilhe o link abaixo com seus amigos e familiares.

Cada pessoa que se inscrever através do seu link conta pontos para você!

*Seu link de compartilhamento*:
${referralLink}

Quanto mais pessoas você convidar para a *Black November da Saúde Vitalícia, maiores serão suas chances de ser o grande vencedor*

Compartilhe vitalidade. Inspire transformação`;

        // Enviar MENSAGEM 1
        console.log(`[Bulk Referral] Enviando mensagem 1/2 para ${lead.nome}...`);
        const response1 = await fetch(`${UNNICHAT_API_URL}/instances/${INSTANCE_ID}/messages/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${UNNICHAT_API_KEY}`
          },
          body: JSON.stringify({
            number: lead.telefone,
            message: message1
          })
        });

        const data1 = await response1.json();

        if (!response1.ok) {
          throw new Error(`Mensagem 1 falhou: ${data1.message || 'Erro desconhecido'}`);
        }

        results.messages_sent++;
        console.log(`[Bulk Referral] ✓ Mensagem 1/2 enviada para ${lead.nome}`);

        // Delay entre mensagens
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_MESSAGES));

        // Enviar MENSAGEM 2
        console.log(`[Bulk Referral] Enviando mensagem 2/2 para ${lead.nome}...`);
        const response2 = await fetch(`${UNNICHAT_API_URL}/instances/${INSTANCE_ID}/messages/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${UNNICHAT_API_KEY}`
          },
          body: JSON.stringify({
            number: lead.telefone,
            message: message2
          })
        });

        const data2 = await response2.json();

        if (!response2.ok) {
          throw new Error(`Mensagem 2 falhou: ${data2.message || 'Erro desconhecido'}`);
        }

        results.messages_sent++;
        console.log(`[Bulk Referral] ✓ Mensagem 2/2 enviada para ${lead.nome}`);
        console.log(`   Link: ${referralLink}`);

        // Registrar envio no Supabase
        await supabase
          .from('whatsapp_messages')
          .insert([
            {
              lead_id: lead.id,
              message_type: 'bulk_referral_intro',
              phone_number: lead.telefone,
              message_content: message1,
              status: 'sent',
              sent_at: new Date().toISOString()
            },
            {
              lead_id: lead.id,
              message_type: 'bulk_referral_link',
              phone_number: lead.telefone,
              message_content: message2,
              referral_link: referralLink,
              status: 'sent',
              sent_at: new Date().toISOString()
            }
          ]);

        results.success++;

        // Delay antes do próximo lead
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_LEADS));

      } catch (error) {
        results.failed++;
        results.errors.push({
          lead_id: lead.id,
          nome: lead.nome,
          telefone: lead.telefone,
          error: error.message
        });
        console.error(`[Bulk Referral] ✗ Erro ao enviar para ${lead.nome}:`, error.message);
      }
    }

    console.log(`[Bulk Referral] Concluído: ${results.success} leads (${results.messages_sent} mensagens), ${results.failed} falhas`);

    return res.status(200).json(results);

  } catch (error) {
    console.error('[Bulk Referral] Erro geral:', error);
    return res.status(500).json({ 
      error: 'Erro ao processar envio em massa',
      details: error.message 
    });
  }
}