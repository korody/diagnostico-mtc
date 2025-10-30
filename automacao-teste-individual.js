// automacao-teste-individual.js
// Testa envio de dados do lead para nova automação Unnichat

const { createClient } = require('@supabase/supabase-js');
const { formatForUnnichat, findLeadByPhone } = require('./lib/phone-simple');

// Forçar produção para evitar confusão
const isProduction = true; // <- FORCE TRUE
const envFile = '.env.production'; // <- FORCE PRODUCTION

require('dotenv').config({ path: envFile });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const NOVA_AUTOMACAO_URL = 'https://unnichat.com.br/a/start/k5LqI8taapN8rpmV9ssV';

// Validar variáveis
if (!supabaseUrl || !supabaseKey) {
	console.error('❌ ERRO: Variáveis de ambiente não configuradas!');
	console.error('   Verifique: SUPABASE_URL, SUPABASE_KEY');
	console.error('   Arquivo:', envFile);
	process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ========================================
// 🎯 CONFIGURE O TELEFONE AQUI
// ========================================
const TELEFONE = '5511998457676'; // ← Altere para seu número

// ========================================
// FUNÇÃO PRINCIPAL
// ========================================

async function main() {
	console.log('\n📞 ========================================');
	console.log('   TESTE NOVA AUTOMAÇÃO - DIAGNÓSTICO (INDIVIDUAL)');
	console.log('========================================');
	console.log('🔧 Ambiente:', isProduction ? '🔴 PRODUÇÃO' : '🟡 STAGING');
	console.log('🔗 Supabase:', supabaseUrl);
	console.log('📱 Telefone buscado:', TELEFONE);
	console.log('🔗 Nova automação:', NOVA_AUTOMACAO_URL);
	console.log('========================================\n');

	try {
		// Buscar lead usando função simplificada (E.164)
		console.log('🔍 Buscando lead no Supabase...\n');

		const searchResult = await findLeadByPhone(supabase, TELEFONE, null);

		if (!searchResult || !searchResult.lead) {
			console.error('❌ Lead não encontrado!');
			return;
		}

		const lead = searchResult.lead;

		// Lead encontrado!
		console.log('✅ Lead encontrado! (método:', searchResult.method + ')');
		console.log('========================================');
		console.log('👤 Nome:', lead.nome);
		console.log('📱 Celular:', lead.celular);
		console.log('📧 Email:', lead.email);
		console.log('🎯 Elemento:', lead.elemento_principal || 'N/A');
		console.log('📊 Lead Score:', lead.lead_score || 0);
		console.log('========================================\n');

		// Preparar dados para automação
		const phoneForUnnichat = formatForUnnichat(lead.celular);

		// Adicionar campo personalizado 'diagnostico'
		const leadData = {
			name: lead.nome,
			email: lead.email || `${lead.celular.replace('+', '')}@placeholder.com`,
			phone: phoneForUnnichat,
			diagnostico: lead.diagnostico_completo || 'Diagnóstico não disponível.'
		};

		console.log('📤 Enviando dados para nova automação...');
		console.log('🔗 URL:', NOVA_AUTOMACAO_URL);
		console.log('📋 Dados:', leadData);
		console.log('');

		// Enviar via automação
		const response = await fetch(NOVA_AUTOMACAO_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(leadData)
		});

		let result;
		try {
			result = await response.json();
		} catch (_) {
			result = { raw: await response.text() };
		}

		console.log('📥 Resposta da automação:');
		console.log(JSON.stringify(result, null, 2));
		console.log('');

		if (response.ok || result.success || result.response !== false) {
			console.log('✅ Dados enviados com sucesso!\n');
			// Atualizar status no banco
			const { error: updateError } = await supabase
				.from('quiz_leads')
				.update({
					whatsapp_status: 'nova_automacao_enviada',
					whatsapp_sent_at: new Date().toISOString(),
					whatsapp_attempts: (lead.whatsapp_attempts || 0) + 1
				})
				.eq('id', lead.id);
			if (updateError) {
				console.log('⚠️  Aviso: Não foi possível atualizar status:', updateError.message);
			} else {
				console.log('✅ Status atualizado no Supabase');
			}
			// Registrar log
			const { error: logError } = await supabase.from('whatsapp_logs').insert({
				lead_id: lead.id,
				phone: lead.celular,
				status: 'nova_automacao_enviada',
				metadata: {
					automacao_response: result,
					manual_send: true,
					script: 'automacao-teste-individual.js'
				},
				sent_at: new Date().toISOString()
			});
			if (!logError) {
				console.log('✅ Log registrado');
			}
		} else {
			console.error('❌ Erro ao enviar para automação!');
			console.error('Detalhes:', result);
			// Salvar erro no banco
			await supabase
				.from('quiz_leads')
				.update({
					whatsapp_status: 'failed',
					whatsapp_error: JSON.stringify(result),
					whatsapp_attempts: (lead.whatsapp_attempts || 0) + 1
				})
				.eq('id', lead.id);
			console.log('\n⚠️  Status atualizado para "failed" no banco');
		}
	} catch (error) {
		console.error('\n❌ ERRO:', error.message);
		console.error('Stack:', error.stack);
	}
}

// Executar
main();
