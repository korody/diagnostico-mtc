import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, CheckCircle, Heart, Activity, Brain, Sparkles } from 'lucide-react';

const QuizMTC = () => {
  // Função para ler parâmetros da URL
  const getUrlParams = () => {
    const params = new URLSearchParams(window.location.search);
    
    // Função helper para capturar múltiplas variações
    const getParam = (...keys) => {
      for (const key of keys) {
        const value = params.get(key);
        if (value) return decodeURIComponent(value);
      }
      return '';
    };
    
    return {
      nome: getParam('nome', 'name', 'first_name', 'firstname'),
      email: getParam('email', 'e-mail', 'mail'),
      celular: getParam('celular', 'telefone', 'phone', 'whatsapp', 'tel'),
      leadId: getParam('leadId', 'lead_id', 'id')
    };
  };

  const urlParams = getUrlParams();
  
  // Se tem dados na URL, pula identificação e vai direto pro quiz
  const temDadosURL = urlParams.nome && urlParams.email && urlParams.celular;
  
  const [step, setStep] = useState(temDadosURL ? 'quiz' : 'identificacao');
  const [dadosLead, setDadosLead] = useState({
    NOME: urlParams.nome,
    EMAIL: urlParams.email,
    CELULAR: urlParams.celular,
    LEAD_ID: urlParams.leadId
  });
  
  const [perguntaAtual, setPerguntaAtual] = useState(0);
  const [respostas, setRespostas] = useState({});
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState('');

  // Perguntas do quiz
  const perguntas = [
    {
      id: 'P1',
      texto: 'Como você descreveria a intensidade das suas dores ou desconfortos?',
      tipo: 'single',
      opcoes: [
        { valor: 'A', texto: 'Dores constantes que limitam MUITO a vida diária', peso: 5 },
        { valor: 'B', texto: 'Dores frequentes que incomodam bastante', peso: 4 },
        { valor: 'C', texto: 'Desconfortos ocasionais que preocupam', peso: 3 },
        { valor: 'D', texto: 'Rigidez ou cansaço, mas nada grave', peso: 2 },
        { valor: 'E', texto: 'Sem dores, busco prevenção', peso: 1 }
      ]
    },
    {
      id: 'P2',
      texto: 'Onde você sente MAIS desconforto ou dor? (Selecione até 2 opções)',
      tipo: 'multiple',
      max: 2,
      opcoes: [
        { valor: 'A', texto: 'Lombar, costas ou coluna', elemento: 'RIM' },
        { valor: 'B', texto: 'Joelhos, pernas ou articulações', elemento: 'RIM' },
        { valor: 'C', texto: 'Pescoço, ombros ou tensão muscular', elemento: 'FÍGADO' },
        { valor: 'D', texto: 'Digestão, estômago ou cansaço extremo', elemento: 'BAÇO' },
        { valor: 'E', texto: 'Insônia, palpitações ou ansiedade', elemento: 'CORAÇÃO' },
        { valor: 'F', texto: 'Respiração curta ou resfriados frequentes', elemento: 'PULMÃO' }
      ]
    },
    {
      id: 'P3',
      texto: 'Há quanto tempo você convive com esses sintomas?',
      tipo: 'single',
      opcoes: [
        { valor: 'A', texto: 'Mais de 5 anos', peso: 5 },
        { valor: 'B', texto: 'Entre 2 e 5 anos', peso: 4 },
        { valor: 'C', texto: 'Entre 6 meses e 2 anos', peso: 3 },
        { valor: 'D', texto: 'Menos de 6 meses', peso: 2 },
        { valor: 'E', texto: 'Não tenho sintomas, busco prevenção', peso: 1 }
      ]
    },
    {
      id: 'P4',
      texto: 'Quais destes sintomas físicos você também percebe? (Selecione até 3)',
      tipo: 'multiple',
      max: 3,
      opcoes: [
        { valor: 'A', texto: 'Cansaço extremo ou falta de energia', elemento: 'RIM' },
        { valor: 'B', texto: 'Sensação de frio ou mãos/pés gelados', elemento: 'RIM' },
        { valor: 'C', texto: 'Insônia, ansiedade ou mente agitada', elemento: 'CORAÇÃO' },
        { valor: 'D', texto: 'Digestão ruim, inchaço ou peso nas pernas', elemento: 'BAÇO' },
        { valor: 'E', texto: 'Tensão muscular ou irritabilidade', elemento: 'FÍGADO' },
        { valor: 'F', texto: 'Nenhum desses', elemento: null }
      ]
    },
    {
      id: 'P5',
      texto: 'Quando pensa nos seus problemas de saúde, como você se sente emocionalmente?',
      tipo: 'single',
      opcoes: [
        { valor: 'A', texto: 'Frustrada e irritada', elemento: 'FÍGADO' },
        { valor: 'B', texto: 'Preocupada e ansiosa', elemento: 'BAÇO' },
        { valor: 'C', texto: 'Triste e desanimada', elemento: 'PULMÃO' },
        { valor: 'D', texto: 'Com medo', elemento: 'RIM' },
        { valor: 'E', texto: 'Sem esperança', elemento: 'CORAÇÃO' },
        { valor: 'F', texto: 'Normal, não me abala muito', elemento: null }
      ]
    },
    {
      id: 'P6',
      texto: 'Você já tentou outros tratamentos antes?',
      tipo: 'single',
      opcoes: [
        { valor: 'A', texto: 'Sim, muitas coisas, mas nada resolveu de verdade', peso: 5 },
        { valor: 'B', texto: 'Sim, algumas coisas (2-3), mas sem resultado duradouro', peso: 4 },
        { valor: 'C', texto: 'Sim, poucas coisas, mais remédios', peso: 3 },
        { valor: 'D', texto: 'Não, nada específico ainda', peso: 2 },
        { valor: 'E', texto: 'Não preciso de tratamento no momento', peso: 1 }
      ]
    },
    {
      id: 'P7',
      texto: 'Qual é a sua maior preocupação em relação à sua saúde?',
      subtexto: 'Queremos focar no que mais importa para você',
      tipo: 'single',
      opcoes: [
        { valor: 'A', texto: 'Perder minha autonomia e depender dos meus filhos', peso: 5 },
        { valor: 'B', texto: 'Não conseguir mais fazer as coisas que gosto', peso: 4 },
        { valor: 'C', texto: 'Ficar cada vez pior se não cuidar agora', peso: 4 },
        { valor: 'D', texto: 'Não estar bem para cuidar da família', peso: 3 },
        { valor: 'E', texto: 'Não conseguir realizar meus sonhos', peso: 3 }
      ]
    },
    {
      id: 'P8',
      texto: 'Como você avalia sua urgência em resolver esse problema?',
      tipo: 'single',
      opcoes: [
        { valor: 'A', texto: 'Não aguento mais, preciso de ajuda URGENTE', peso: 5 },
        { valor: 'B', texto: 'Estou muito incomodada, chegou a hora de agir', peso: 4 },
        { valor: 'C', texto: 'Quero melhorar e estou aberta a soluções', peso: 3 },
        { valor: 'D', texto: 'Estou buscando alternativas e pesquisando', peso: 2 },
        { valor: 'E', texto: 'Só estou curiosa, sem urgência real', peso: 1 }
      ]
    },
    {
      id: 'P9',
      texto: 'Sobre participar do nosso evento ao vivo exclusivo:',
      tipo: 'single',
      opcoes: [
        { valor: 'A', texto: 'Vou participar COM CERTEZA, estou pronta pra mudar', peso: 5 },
        { valor: 'B', texto: 'Vou participar e estou bem interessada', peso: 4 },
        { valor: 'C', texto: 'Pretendo participar se conseguir', peso: 3 },
        { valor: 'D', texto: 'Ainda não sei se vou conseguir', peso: 2 },
        { valor: 'E', texto: 'Só me cadastrei para conhecer', peso: 1 }
      ]
    },
    {
      id: 'P10',
      texto: 'Qual é a sua faixa etária?',
      tipo: 'single',
      opcoes: [
        { valor: 'A', texto: 'Menos de 18 anos' },
        { valor: 'B', texto: '18-24 anos' },
        { valor: 'C', texto: '25-34 anos' },
        { valor: 'D', texto: '35-44 anos' },
        { valor: 'E', texto: '45-54 anos' },
        { valor: 'F', texto: '55-64 anos' },
        { valor: 'G', texto: '65-74 anos' },
        { valor: 'H', texto: '75-84 anos' }
      ]
    },
    {
      id: 'P11',
      texto: 'Qual é a sua renda mensal aproximada?',
      subtexto: 'Essa pergunta é importante para eu poder adaptar nosso treinamento à renda da maioria durante o curso ;)',
      tipo: 'single',
      opcoes: [
        { valor: 'A', texto: 'Sem renda no momento' },
        { valor: 'B', texto: 'Até R$ 1.000' },
        { valor: 'C', texto: 'Até R$ 2.000' },
        { valor: 'D', texto: 'Até R$ 3.000' },
        { valor: 'E', texto: 'Até R$ 4.000' },
        { valor: 'F', texto: 'Até R$ 5.000' },
        { valor: 'G', texto: 'Até R$ 7.000' },
        { valor: 'H', texto: 'Até R$ 10.000' },
        { valor: 'I', texto: 'Até R$ 15.000' },
        { valor: 'J', texto: 'Mais de R$ 20.000' }
      ]
    },
    {
      id: 'P12',
      texto: 'Você já é ou foi aluno(a) do Mestre Ye?',
      subtexto: 'Isso nos ajuda a personalizar melhor sua experiência no evento',
      tipo: 'single',
      opcoes: [
        { valor: 'A', texto: 'Ainda não sou aluno(a)' },
        { valor: 'B', texto: 'Sim, sou ou já fui aluno(a)' }
      ]
    },
    {
      id: 'P13',
      texto: 'Há quanto tempo você conhece o trabalho do Mestre Ye?',
      tipo: 'single',
      opcoes: [
        { valor: 'A', texto: 'Conheci agora através de amigos ou familiares' },
        { valor: 'B', texto: 'Conheci agora através de anúncios' },
        { valor: 'C', texto: 'Há pouco tempo (1-3 meses)' },
        { valor: 'D', texto: 'Há cerca de 6 meses' },
        { valor: 'E', texto: 'Há bastante tempo (mais de 1 ano)' }
      ]
    }
  ];

  // Validações
  const validarEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validarCelular = (celular) => {
    if (!celular) return false;
    const texto = celular.trim();

    // Aceita E.164 (ex: +351917068586, +5511999999999)
    if (texto.startsWith('+')) {
      const cleaned = texto.replace(/\s+/g, '');
      return /^\+\d{8,15}$/.test(cleaned);
    }

    // Caso local (sem +): aceitar entre 8 e 11 dígitos (ex: 99999999, 11999999999)
    const raw = texto.replace(/\D/g, '');
    return raw.length >= 8 && raw.length <= 11;
  };

  const formatarCelular = (valor) => {
    if (!valor) return '';

    // Preserve international E.164-like input (keep + and digits)
    if (valor.trim().startsWith('+')) {
      return valor.replace(/[^\d+]/g, '').replace(/\s+/g, '');
    }

    const numeros = valor.replace(/\D/g, '');
    if (numeros.length <= 10) {
      return numeros.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    }
    return numeros.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
  };

  // Handlers
  const handleInputChange = (campo, valor) => {
    if (campo === 'CELULAR') {
      // If user types an international number starting with +, preserve the + and digits
      // and don't apply the Brazilian DDD formatting which would mangle +DDI inputs.
      if (valor && valor.trim().startsWith('+')) {
        // Allow +, digits and spaces only; normalize multiple spaces to single
        valor = valor.replace(/[^\d+\s]/g, '').replace(/\s+/g, ' ').trim();
      } else {
        valor = formatarCelular(valor);
      }
    }
    setDadosLead(prev => ({ ...prev, [campo]: valor }));
    setErro('');
  };

  const handleIniciarQuiz = () => {
    if (!dadosLead.NOME || dadosLead.NOME.length < 3) {
      setErro('Por favor, digite seu nome completo');
      return;
    }
    if (!validarEmail(dadosLead.EMAIL)) {
      setErro('Por favor, digite um email válido');
      return;
    }
    if (!validarCelular(dadosLead.CELULAR)) {
      setErro('Por favor, digite um número de WhatsApp válido. Use +DD... para internacional ou 8–11 dígitos (ex: +351917068586 ou (11) 99999-9999)');
      return;
    }
    setStep('quiz');
  };

  const handleResposta = (perguntaId, valor) => {
    const pergunta = perguntas[perguntaAtual];
    
    if (pergunta.tipo === 'single') {
      setRespostas(prev => ({ ...prev, [perguntaId]: valor }));
    } else {
      const respostaAtual = respostas[perguntaId] || [];
      if (respostaAtual.includes(valor)) {
        setRespostas(prev => ({
          ...prev,
          [perguntaId]: respostaAtual.filter(v => v !== valor)
        }));
      } else {
        if (respostaAtual.length < pergunta.max) {
          setRespostas(prev => ({
            ...prev,
            [perguntaId]: [...respostaAtual, valor]
          }));
        }
      }
    }
  };

  const proximaPergunta = () => {
    if (perguntaAtual < perguntas.length - 1) {
      setPerguntaAtual(perguntaAtual + 1);
    } else {
      finalizarQuiz();
    }
  };

  const voltarPergunta = () => {
    if (perguntaAtual > 0) {
      setPerguntaAtual(perguntaAtual - 1);
    }
  };

  const respostaAtualValida = () => {
    const pergunta = perguntas[perguntaAtual];
    const resposta = respostas[pergunta.id];
    
    if (pergunta.tipo === 'single') {
      return !!resposta;
    } else {
      return resposta && resposta.length > 0;
    }
  };

  const finalizarQuiz = async () => {
    console.log('\n🔵 INICIANDO FINALIZAÇÃO DO QUIZ');
    console.log('==================================');
    
    setProcessando(true);
    
    try {
      const payload = {
        lead: {
          NOME: dadosLead.NOME,
          EMAIL: dadosLead.EMAIL,
          CELULAR: dadosLead.CELULAR
        },
        respostas: respostas
      };
      
      console.log('📦 Payload preparado:', JSON.stringify(payload, null, 2));
      
      // Desenvolvimento local: Express na porta 3001
      // Produção: Serverless Vercel (URL relativa)
      const apiUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:3001/api/submit'
        : '/api/submit';
      
      console.log('🌐 URL da API:', apiUrl);
      console.log('📤 Enviando requisição...');
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      console.log('📥 Resposta recebida! Status:', response.status);
      
      let result;
      try {
        const responseText = await response.text();
        console.log('📄 Response Text:', responseText);
        result = JSON.parse(responseText);
        console.log('✅ JSON parseado:', result);
      } catch (parseError) {
        console.error('❌ Erro ao parsear JSON:', parseError);
        throw new Error('Resposta da API não é um JSON válido');
      }
      
      if (!response.ok) {
        console.error('❌ Resposta não OK! Status:', response.status);
        throw new Error(result.error || result.detalhes || `Erro HTTP ${response.status}`);
      }
      
      if (result.success) {
        console.log('✅ QUIZ SALVO COM SUCESSO!');
        console.log('  Lead ID:', result.lead_id);
        console.log('  Diagnóstico:', result.diagnostico);
        
        setStep('resultado');
        
        setTimeout(() => {
          console.log('🔄 Redirecionando...');
          window.top.location.href = 'https://black.qigongbrasil.com/diagnostico';
        }, 2000);
      } else {
        throw new Error(result.message || 'Erro desconhecido');
      }
      
    } catch (error) {
      console.error('\n❌ ERRO CAPTURADO:');
      console.error('Tipo:', error.constructor.name);
      console.error('Mensagem:', error.message);
      
      setErro(`Erro ao enviar o quiz: ${error.message}`);
      alert(`Erro ao finalizar quiz:\n\n${error.message}\n\nVerifique o console para mais detalhes.`);
      
    } finally {
      setProcessando(false);
      console.log('🔵 Finalização concluída');
    }
  };

  const progresso = ((perguntaAtual + 1) / perguntas.length) * 100;

  // Render da tela de identificação
  // Render da tela de identificação
if (step === 'identificacao') {
  return (
    <div className="min-h-screen p-4 pt-8" style={{ background: 'transparent' }}>
      <div className="w-full max-w-lg mx-auto">
        
        {/* Popup Card Branco */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 animate-fade-in">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mb-4 text-cyan-500">
              <Sparkles className="w-12 h-12 mx-auto" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-1">BLACK NOVEMBER</h1>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent mb-3">
              DA SAÚDE VITALÍCIA
            </h2>
            <p className="text-slate-600 text-sm">COM MESTRE YE</p>
          </div>

          {/* Título da Seção */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Diagnóstico Personalizado</h3>
            <p className="text-slate-600 text-sm">
              Descubra seu perfil energético segundo a Medicina Tradicional Chinesa
            </p>
          </div>

          {/* Formulário */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-slate-700 text-sm font-medium mb-2">
                Nome Completo *
              </label>
              <input
                type="text"
                value={dadosLead.NOME}
                onChange={(e) => handleInputChange('NOME', e.target.value)}
                placeholder="Digite seu nome completo"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-slate-700 text-sm font-medium mb-2">
                E-mail *
              </label>
              <input
                type="email"
                value={dadosLead.EMAIL}
                onChange={(e) => handleInputChange('EMAIL', e.target.value)}
                placeholder="seu@email.com"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-slate-700 text-sm font-medium mb-2">
                Celular (WhatsApp) *
              </label>
              
              {/* 📱 Aviso importante */}
              <p className="text-sm text-blue-600 mb-2 flex items-center">
                <span className="mr-1">📱</span>
                Revise com atenção! Seu diagnóstico será enviado via WhatsApp.
              </p>

              <input
                type="tel"
                value={dadosLead.CELULAR}
                onChange={(e) => handleInputChange('CELULAR', e.target.value)}
                placeholder="Ex: 55 11 99999-9999"
                maxLength="25"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400"
              />
            </div>
          </div>

          {/* Mensagem de Erro */}
          {erro && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              ⚠️ {erro}
            </div>
          )}

          {/* Info de Segurança */}
          <div className="text-center mb-6">
            <p className="text-slate-500 text-xs">
              🔒 Seus dados estão seguros • ⏱️ Tempo estimado: 4 minutos
            </p>
          </div>

          {/* Botão Principal */}
          <button
            onClick={handleIniciarQuiz}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 flex items-center justify-center gap-2 transform hover:scale-[1.02]"
          >
            INICIAR DIAGNÓSTICO
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        
      </div>
    </div>
  );
} 

  // Render da tela de quiz
  // Render da tela de quiz
if (step === 'quiz') {
  const pergunta = perguntas[perguntaAtual];
  const respostaAtual = respostas[pergunta.id];

  return (
    <div className="min-h-screen p-4 pt-8" style={{ background: 'transparent' }}>
      
      {/* Container do Popup */}
      <div className="w-full max-w-2xl mx-auto">
        
        {/* Barra de Progresso */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-cyan-500 text-sm font-medium">Pergunta {perguntaAtual + 1}</span>
            <span className="text-cyan-500 text-sm font-bold">{Math.round(progresso)}%</span>
          </div>
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-cyan-500 to-blue-500 transition-all duration-500"
              style={{ width: `${progresso}%` }}
            />
          </div>
        </div>

        {/* Popup Card Branco da Pergunta */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-4 animate-fade-in">
          
          {/* Título da Pergunta */}
          <h3 className="text-2xl font-bold text-slate-900 mb-6 leading-tight">
            {pergunta.texto}
          </h3>

          {/* Subtexto (se houver) */}
          {pergunta.subtexto && (
            <p className="text-slate-600 text-sm mb-6 italic border-l-4 border-cyan-500 pl-4 py-2 bg-cyan-50 rounded">
              💡 {pergunta.subtexto}
            </p>
          )}

          {/* Info para perguntas múltiplas */}
          {pergunta.tipo === 'multiple' && (
            <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-3 mb-6">
              <p className="text-cyan-700 text-sm font-medium">
                📌 Você pode selecionar até {pergunta.max} opções
                {respostaAtual && respostaAtual.length > 0 && (
                  <span className="ml-2 font-bold">
                    • {respostaAtual.length} de {pergunta.max} selecionada{respostaAtual.length > 1 ? 's' : ''}
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Opções de Resposta */}
          <div className={
            pergunta.id === 'P10' || pergunta.id === 'P11' 
              ? 'grid grid-cols-2 gap-3' 
              : 'space-y-3'
          }>
            {pergunta.opcoes.map((opcao) => {
              const selecionada = pergunta.tipo === 'single'
                ? respostaAtual === opcao.valor
                : respostaAtual && respostaAtual.includes(opcao.valor);

              return (
                <button
                  key={opcao.valor}
                  onClick={() => handleResposta(pergunta.id, opcao.valor)}
                  className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left transform hover:scale-[1.01] ${
                    selecionada
                      ? 'bg-gradient-to-r from-cyan-50 to-blue-50 border-cyan-500 shadow-md'
                      : 'bg-slate-50 border-slate-300 hover:border-cyan-400 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      selecionada ? 'border-cyan-500 bg-cyan-500' : 'border-slate-400'
                    }`}>
                      {selecionada && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                    <span className={`font-medium ${selecionada ? 'text-slate-900' : 'text-slate-700'}`}>
                      {opcao.texto}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Botões de Navegação */}
        <div className="flex gap-3">
          {perguntaAtual > 0 && (
            <button
              onClick={voltarPergunta}
              className="flex-1 bg-white hover:bg-slate-50 text-slate-700 font-bold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 border-2 border-slate-300 hover:border-slate-400 shadow-lg"
            >
              <ChevronLeft className="w-5 h-5" />
              Voltar
            </button>
          )}
          
          <button
            onClick={proximaPergunta}
            disabled={!respostaAtualValida() || processando}
            className={`flex-1 font-bold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg ${
              respostaAtualValida() && !processando
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-cyan-500/30 hover:shadow-cyan-500/50 transform hover:scale-[1.02]'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {processando ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Processando...
              </>
            ) : perguntaAtual === perguntas.length - 1 ? (
              <>
                Finalizar
                <CheckCircle className="w-5 h-5" />
              </>
            ) : (
              <>
                Próxima
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

  // Render da tela de resultado
if (step === 'resultado') {
  return (
    <div className="min-h-screen p-4 pt-8" style={{ background: 'transparent' }}>
      <div className="w-full max-w-lg mx-auto">
        
        {/* Popup Branco de Sucesso */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center animate-fade-in">
          
          {/* Ícone de Loading */}
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto mb-4 relative">
              <div className="absolute inset-0 border-4 border-cyan-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-cyan-500 rounded-full border-t-transparent animate-spin"></div>
              <CheckCircle className="absolute inset-0 m-auto w-10 h-10 text-cyan-500" />
            </div>
          </div>
          
          {/* Título */}
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            ✅ Diagnóstico Concluído!
          </h2>
          
          {/* Descrição */}
          <p className="text-xl text-slate-600 mb-6">
            Suas respostas foram salvas com sucesso!
          </p>
          
          {/* Box de Status */}
          <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border-2 border-cyan-200 rounded-2xl p-6 mb-6">
            <p className="text-cyan-700 text-lg font-semibold mb-2">
              📤 Enviando seus dados...
            </p>
            <p className="text-slate-600 text-sm">
              Você será redirecionado automaticamente em instantes
            </p>
          </div>
          
          {/* Link Manual */}
          <p className="text-slate-500 text-sm">
            Se não for redirecionado automaticamente,{' '}
            <a 
              href="https://black.qigongbrasil.com/diagnostico"
              className="text-cyan-500 hover:text-cyan-600 underline font-semibold transition-colors"
            >
              clique aqui
            </a>
          </p>
        </div>
        
      </div>
    </div>
  );
}

  return null;
};

export default QuizMTC;