import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, CheckCircle, Heart, Activity, Brain, Sparkles } from 'lucide-react';

const QuizMTC = () => {
  // Função para ler parâmetros da URL
  const getUrlParams = () => {
    const params = new URLSearchParams(window.location.search);
    return {
      nome: params.get('nome') || '',
      email: params.get('email') || '',
      celular: params.get('celular') || '',
      leadId: params.get('leadId') || ''
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
    const re = /^\(\d{2}\)\s?\d{4,5}-?\d{4}$/;
    return re.test(celular);
  };

  const formatarCelular = (valor) => {
    const numeros = valor.replace(/\D/g, '');
    if (numeros.length <= 10) {
      return numeros.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    }
    return numeros.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
  };

  // Handlers
  const handleInputChange = (campo, valor) => {
    if (campo === 'CELULAR') {
      valor = formatarCelular(valor);
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
      setErro('Por favor, digite um celular válido no formato (00) 00000-0000');
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
    // 1. Preparar dados
    console.log('📝 Preparando dados...');
    const payload = {
      lead: {
        NOME: dadosLead.NOME,
        EMAIL: dadosLead.EMAIL,
        CELULAR: dadosLead.CELULAR
      },
      respostas: respostas
    };
    
    console.log('📦 Payload preparado:');
    console.log(JSON.stringify(payload, null, 2));
    
    // 2. Determinar URL
    const apiUrl = window.location.hostname === 'localhost' 
  ? 'http://localhost:3001/api/submit'
  : '/api/submit';
    
    console.log('🌐 URL da API:', apiUrl);
    
    // 3. Fazer requisição
    console.log('📤 Enviando requisição...');
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    console.log('📥 Resposta recebida!');
    console.log('  Status:', response.status);
    console.log('  Status Text:', response.statusText);
    console.log('  OK:', response.ok);
    
    // 4. Processar resposta
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
    
    // 5. Verificar sucesso
    if (!response.ok) {
      console.error('❌ Resposta não OK!');
      console.error('  Status:', response.status);
      console.error('  Resultado:', result);
      throw new Error(result.error || result.detalhes || `Erro HTTP ${response.status}`);
    }
    
    if (result.success) {
      console.log('✅ QUIZ SALVO COM SUCESSO!');
      console.log('  Lead ID:', result.lead_id);
      console.log('  Diagnóstico:', result.diagnostico);
      
      setStep('resultado');
      
      setTimeout(() => {
        console.log('🔄 Redirecionando...');
        window.location.href = 'https://black.qigongbrasil.com/diagnostico';
      }, 2000);
    } else {
      throw new Error(result.message || 'Erro desconhecido');
    }
    
  } catch (error) {
    console.error('\n❌ ERRO CAPTURADO:');
    console.error('==================================');
    console.error('Tipo:', error.constructor.name);
    console.error('Mensagem:', error.message);
    console.error('Stack:', error.stack);
    console.error('==================================\n');
    
    setErro(`Erro ao enviar o quiz: ${error.message}`);
    
    // Mostrar alerta para o usuário
    alert(`Erro ao finalizar quiz:\n\n${error.message}\n\nVerifique o console para mais detalhes.`);
    
  } finally {
    setProcessando(false);
    console.log('🔵 Finalização concluída (sucesso ou erro)');
  }
};

  const progresso = ((perguntaAtual + 1) / perguntas.length) * 100;

  // Render da tela de identificação
  if (step === 'identificacao') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-900 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-cyan-500/20 shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="mb-4 text-cyan-400">
              <Sparkles className="w-16 h-16 mx-auto" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">BLACK NOVEMBER</h1>
            <h2 className="text-3xl font-bold text-cyan-400 mb-4">DA SAÚDE VITALÍCIA</h2>
            <p className="text-slate-300 text-lg">COM MESTRE YE</p>
          </div>

          <div className="mb-8">
            <h3 className="text-2xl font-bold text-white mb-4">Diagnóstico Personalizado</h3>
            <p className="text-slate-300 mb-4">
              Descubra seu perfil energético segundo a Medicina Tradicional Chinesa
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-slate-300 mb-2">Nome Completo *</label>
              <input
                type="text"
                value={dadosLead.NOME}
                onChange={(e) => handleInputChange('NOME', e.target.value)}
                placeholder="Digite seu nome completo"
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-2">E-mail *</label>
              <input
                type="email"
                value={dadosLead.EMAIL}
                onChange={(e) => handleInputChange('EMAIL', e.target.value)}
                placeholder="seu@email.com"
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-2">Celular (WhatsApp) *</label>
              <input
                type="tel"
                value={dadosLead.CELULAR}
                onChange={(e) => handleInputChange('CELULAR', e.target.value)}
                placeholder="(00) 00000-0000"
                maxLength="15"
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {erro && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
              {erro}
            </div>
          )}

          <div className="text-center mb-6">
            <p className="text-slate-400 text-sm mb-2">
              🔒 Seus dados estão seguros • ⏱️ Tempo estimado: 4 minutos
            </p>
          </div>

          <button
            onClick={handleIniciarQuiz}
            className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-slate-900 font-bold py-4 px-6 rounded-lg transition-all duration-200 shadow-lg shadow-cyan-500/50 flex items-center justify-center gap-2"
          >
            INICIAR DIAGNÓSTICO
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // Render da tela de quiz
  if (step === 'quiz') {
    const pergunta = perguntas[perguntaAtual];
    const respostaAtual = respostas[pergunta.id];

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-900 flex items-center justify-center p-4">
        <div className="max-w-3xl w-full">
          {/* Barra de progresso */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-300 text-sm">Pergunta {perguntaAtual + 1} de {perguntas.length}</span>
              <span className="text-cyan-400 text-sm font-bold">{Math.round(progresso)}%</span>
            </div>
            <div className="w-full h-3 bg-slate-700/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-cyan-600 transition-all duration-500 shadow-lg shadow-cyan-500/50"
                style={{ width: `${progresso}%` }}
              />
            </div>
          </div>

          {/* Card da pergunta */}
          <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-cyan-500/20 shadow-2xl p-8 mb-6">
            <h3 className="text-2xl font-bold text-white mb-6">
              {pergunta.texto}
            </h3>

            {pergunta.tipo === 'multiple' && (
              <p className="text-cyan-400 text-sm mb-4">
                Você pode selecionar até {pergunta.max} opções • Selecionadas: {respostaAtual ? respostaAtual.length : 0}
              </p>
            )}

            <div className="space-y-3">
              {pergunta.opcoes.map((opcao) => {
                const selecionada = pergunta.tipo === 'single'
                  ? respostaAtual === opcao.valor
                  : respostaAtual && respostaAtual.includes(opcao.valor);

                return (
                  <button
                    key={opcao.valor}
                    onClick={() => handleResposta(pergunta.id, opcao.valor)}
                    className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                      selecionada
                        ? 'bg-cyan-500/20 border-cyan-500 text-white'
                        : 'bg-slate-700/30 border-slate-600 text-slate-300 hover:border-cyan-500/50 hover:bg-slate-700/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        selecionada ? 'border-cyan-500 bg-cyan-500' : 'border-slate-500'
                      }`}>
                        {selecionada && (
                          <div className="w-2 h-2 bg-slate-900 rounded-full"></div>
                        )}
                      </div>
                      <span className="font-medium">{opcao.texto}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Botões de navegação */}
          <div className="flex gap-4">
            {perguntaAtual > 0 && (
              <button
                onClick={voltarPergunta}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                <ChevronLeft className="w-5 h-5" />
                Voltar
              </button>
            )}
            
            <button
              onClick={proximaPergunta}
              disabled={!respostaAtualValida() || processando}
              className={`flex-1 font-bold py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                respostaAtualValida() && !processando
                  ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-slate-900 shadow-lg shadow-cyan-500/50'
                  : 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
              }`}
            >
              {processando ? (
                'Processando...'
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

  // Render da tela de resultado (mostra "Enviando..." antes de redirecionar)
  if (step === 'resultado') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-900 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-cyan-500/20 shadow-2xl p-8 text-center">
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto mb-4 relative">
              <div className="absolute inset-0 border-4 border-cyan-500/30 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-cyan-500 rounded-full border-t-transparent animate-spin"></div>
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-white mb-4">
            ✅ Diagnóstico Concluído!
          </h2>
          
          <p className="text-xl text-slate-300 mb-6">
            Suas respostas foram salvas com sucesso!
          </p>
          
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-6 mb-6">
            <p className="text-cyan-300 text-lg font-semibold mb-2">
              📤 Enviando seus dados...
            </p>
            <p className="text-slate-400 text-sm">
              Você será redirecionado automaticamente em instantes
            </p>
          </div>
          
          <p className="text-slate-400 text-sm">
            Se não for redirecionado automaticamente,{' '}
            <a 
              href="https://black.qigongbrasil.com/diagnostico"
              className="text-cyan-400 hover:text-cyan-300 underline font-semibold"
            >
              clique aqui
            </a>
          </p>
        </div>
      </div>
    );
  }

  return null;
};

export default QuizMTC;