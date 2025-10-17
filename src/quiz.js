import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, CheckCircle, Heart, Activity, Brain, Sparkles } from 'lucide-react';

const QuizMTC = () => {
  const [step, setStep] = useState('identificacao'); // 'identificacao', 'quiz', 'resultado'
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [respostas, setRespostas] = useState({});
  const [dadosLead, setDadosLead] = useState({
    NOME: '',
    EMAIL: '',
    CELULAR: ''
  });

  // Definição das perguntas
  const perguntas = [
    {
      id: 'P1',
      numero: 1,
      bloco: 'DOR',
      icone: Activity,
      cor: 'bg-red-500',
      titulo: 'Intensidade da Dor',
      pergunta: 'Qual destas situações MELHOR descreve o que você está vivendo AGORA?',
      tipo: 'single',
      opcoes: [
        { valor: 'A', texto: 'Tenho dores constantes que limitam MUITO minha vida diária' },
        { valor: 'B', texto: 'Sinto dores frequentes que me incomodam bastante' },
        { valor: 'C', texto: 'Tenho desconfortos ocasionais que me preocupam' },
        { valor: 'D', texto: 'Sinto rigidez ou cansaço, mas nada grave' },
        { valor: 'E', texto: 'Não tenho dores, mas quero prevenir problemas futuros' }
      ]
    },
    {
      id: 'P2',
      numero: 2,
      bloco: 'MTC',
      icone: Heart,
      cor: 'bg-purple-500',
      titulo: 'Localização da Dor',
      pergunta: 'Onde você sente MAIS desconforto ou dor? (Selecione até 2 opções)',
      tipo: 'multiple',
      max: 2,
      opcoes: [
        { valor: 'A', texto: 'Lombar, costas ou coluna', elemento: 'RIM' },
        { valor: 'B', texto: 'Joelhos, pernas ou articulações', elemento: 'RIM' },
        { valor: 'C', texto: 'Pescoço, ombros ou tensão muscular', elemento: 'FÍGADO' },
        { valor: 'D', texto: 'Digestão, estômago ou cansaço extremo', elemento: 'BAÇO' },
        { valor: 'E', texto: 'Insônia, palpitações ou ansiedade', elemento: 'CORAÇÃO' },
        { valor: 'F', texto: 'Respiração curta, resfriados frequentes', elemento: 'PULMÃO' }
      ]
    },
    {
      id: 'P3',
      numero: 3,
      bloco: 'DOR',
      icone: Activity,
      cor: 'bg-red-500',
      titulo: 'Histórico',
      pergunta: 'Há quanto tempo você convive com essa situação?',
      tipo: 'single',
      opcoes: [
        { valor: 'A', texto: 'Mais de 5 anos - já virou parte da minha vida' },
        { valor: 'B', texto: 'Entre 2 e 5 anos - tentei várias coisas, mas não resolveu' },
        { valor: 'C', texto: 'Entre 6 meses e 2 anos - está piorando progressivamente' },
        { valor: 'D', texto: 'Menos de 6 meses - comecei a sentir recentemente' },
        { valor: 'E', texto: 'Não tenho problema agora, mas quero prevenir' }
      ]
    },
    {
      id: 'P4',
      numero: 4,
      bloco: 'MTC',
      icone: Heart,
      cor: 'bg-purple-500',
      titulo: 'Sintomas Físicos',
      pergunta: 'Além da dor, qual(is) destes você TAMBÉM sente? (Selecione até 3)',
      tipo: 'multiple',
      max: 3,
      opcoes: [
        { valor: 'A', texto: 'Cansaço extremo, falta de energia' },
        { valor: 'B', texto: 'Sensação de frio, mãos/pés gelados' },
        { valor: 'C', texto: 'Insônia, ansiedade, mente agitada' },
        { valor: 'D', texto: 'Digestão ruim, inchaço, peso nas pernas' },
        { valor: 'E', texto: 'Tensão muscular, irritabilidade' },
        { valor: 'F', texto: 'Nenhum desses - só tenho a dor mesmo' }
      ]
    },
    {
      id: 'P5',
      numero: 5,
      bloco: 'MTC',
      icone: Brain,
      cor: 'bg-purple-500',
      titulo: 'Sintomas Emocionais',
      pergunta: 'Como você se SENTE emocionalmente quando sua dor/desconforto aparece?',
      tipo: 'single',
      opcoes: [
        { valor: 'A', texto: 'Frustrada e irritada - "de novo isso!"' },
        { valor: 'B', texto: 'Preocupada e ansiosa - "e se piorar?"' },
        { valor: 'C', texto: 'Triste e desanimada - "nunca vou melhorar"' },
        { valor: 'D', texto: 'Com medo - "vou perder minha independência"' },
        { valor: 'E', texto: 'Sem esperança - "é assim mesmo, fazer o quê"' },
        { valor: 'F', texto: 'Normal, não me abala emocionalmente' }
      ]
    },
    {
      id: 'P6',
      numero: 6,
      bloco: 'ESPERANÇA',
      icone: Sparkles,
      cor: 'bg-blue-500',
      titulo: 'Tentativas Anteriores',
      pergunta: 'O que você JÁ TENTOU para melhorar sua saúde?',
      tipo: 'single',
      opcoes: [
        { valor: 'A', texto: 'Muitas coisas: remédios, fisioterapia, massagem... nada resolveu' },
        { valor: 'B', texto: 'Algumas coisas (2-3 tratamentos), sem resultado duradouro' },
        { valor: 'C', texto: 'Poucas coisas - só remédios que o médico passou' },
        { valor: 'D', texto: 'Nada específico ainda - estou começando a buscar soluções' },
        { valor: 'E', texto: 'Não preciso de tratamento - busco conhecimento preventivo' }
      ]
    },
    {
      id: 'P7',
      numero: 7,
      bloco: 'ARQUÉTIPO',
      icone: Heart,
      cor: 'bg-pink-500',
      titulo: 'Preocupação Principal',
      pergunta: 'Quando você pensa no seu futuro, o que MAIS te preocupa?',
      tipo: 'single',
      opcoes: [
        { valor: 'A', texto: 'Perder minha autonomia e ter que depender dos meus filhos' },
        { valor: 'B', texto: 'Não conseguir mais fazer as coisas que gosto (viajar, cuidar da casa)' },
        { valor: 'C', texto: 'Ficar cada vez pior e sem solução real' },
        { valor: 'D', texto: 'Não estar bem para cuidar da minha família' },
        { valor: 'E', texto: 'Não realizar meus sonhos e planos para essa fase da vida' }
      ]
    },
    {
      id: 'P8A',
      numero: 8,
      bloco: 'URGÊNCIA',
      icone: Activity,
      cor: 'bg-orange-500',
      titulo: 'Urgência',
      pergunta: 'Pensando na sua saúde e bem-estar, qual frase te representa melhor AGORA?',
      tipo: 'single',
      opcoes: [
        { valor: 'A', texto: 'Não aguento mais sofrer com isso - preciso de uma solução URGENTE' },
        { valor: 'B', texto: 'Estou muito incomodada e quero resolver de vez - chegou a hora' },
        { valor: 'C', texto: 'Quero melhorar e estou aberta a conhecer uma solução' },
        { valor: 'D', texto: 'Busco alternativas, mas ainda estou pesquisando' },
        { valor: 'E', texto: 'Só vim conhecer por curiosidade, sem urgência' }
      ]
    },
    {
      id: 'P8B',
      numero: 9,
      bloco: 'EVENTO',
      icone: Sparkles,
      cor: 'bg-yellow-500',
      titulo: 'Participação no Evento',
      pergunta: 'Sobre o evento onde vamos apresentar a oferta completa da Black November Vitalícia:',
      tipo: 'single',
      opcoes: [
        { valor: 'A', texto: 'Vou participar COM CERTEZA - estou pronta para garantir' },
        { valor: 'B', texto: 'Vou participar e estou muito interessada - quero entender tudo' },
        { valor: 'C', texto: 'Pretendo participar - preciso ver se cabe no meu momento' },
        { valor: 'D', texto: 'Ainda não sei se vou conseguir participar' },
        { valor: 'E', texto: 'Só me cadastrei para conhecer, sem compromisso' }
      ]
    },
    {
      id: 'P9',
      numero: 10,
      bloco: 'PERFIL',
      icone: Brain,
      cor: 'bg-indigo-500',
      titulo: 'Faixa Etária',
      pergunta: 'Qual é a sua faixa etária?',
      tipo: 'single',
      opcoes: [
        { valor: 'A', texto: 'Menos que 18 anos' },
        { valor: 'B', texto: '18 a 24 anos' },
        { valor: 'C', texto: '25 a 34 anos' },
        { valor: 'D', texto: '35 a 44 anos' },
        { valor: 'E', texto: '45 a 54 anos' },
        { valor: 'F', texto: '55 a 64 anos' },
        { valor: 'G', texto: '65 a 74 anos' },
        { valor: 'H', texto: '75 a 84 anos' }
      ]
    },
    {
      id: 'P10',
      numero: 11,
      bloco: 'PERFIL',
      icone: Sparkles,
      cor: 'bg-green-500',
      titulo: 'Renda Mensal',
      pergunta: 'Qual é a sua renda mensal hoje?',
      tipo: 'single',
      opcoes: [
        { valor: 'A', texto: 'Não possuo renda no momento' },
        { valor: 'B', texto: 'Média de R$ 1.000 por mês' },
        { valor: 'C', texto: 'Média de R$ 2.000 por mês' },
        { valor: 'D', texto: 'Média de R$ 3.000 por mês' },
        { valor: 'E', texto: 'Média de R$ 4.000 por mês' },
        { valor: 'F', texto: 'Média de R$ 5.000 por mês' },
        { valor: 'G', texto: 'Até R$ 7.000 por mês' },
        { valor: 'H', texto: 'Até R$ 10.000 por mês' },
        { valor: 'I', texto: 'Até R$ 15.000 por mês' },
        { valor: 'J', texto: 'Mais de R$ 20.000 por mês' }
      ]
    },
    {
      id: 'P11',
      numero: 12,
      bloco: 'CONFIANÇA',
      icone: Heart,
      cor: 'bg-rose-500',
      titulo: 'Relacionamento',
      pergunta: 'Você já é / foi minha aluna ou aluno em algum dos meus cursos pagos?',
      tipo: 'single',
      opcoes: [
        { valor: 'A', texto: 'Ainda não sou aluno(a)' },
        { valor: 'B', texto: 'Sim, sou / fui aluno(a)' }
      ]
    },
    {
      id: 'P12',
      numero: 13,
      bloco: 'CONFIANÇA',
      icone: Brain,
      cor: 'bg-rose-500',
      titulo: 'Tempo de Relacionamento',
      pergunta: 'Há quanto tempo você me conhece?',
      tipo: 'single',
      opcoes: [
        { valor: 'A', texto: 'Conheci agora através da indicação de amigos/familiares' },
        { valor: 'B', texto: 'Conheci agora através dos anúncios do evento' },
        { valor: 'C', texto: 'Há pouco tempo (cerca de 1 a 3 meses)' },
        { valor: 'D', texto: 'Há mais ou menos 6 meses' },
        { valor: 'E', texto: 'Há bastante tempo (mais de 1 ano)' }
      ]
    }
  ];

  const perguntaAtual = perguntas[currentQuestion];
  const totalPerguntas = perguntas.length;
  const progresso = ((currentQuestion + 1) / totalPerguntas) * 100;

  // Handlers
  const handleLeadDataChange = (campo, valor) => {
    setDadosLead(prev => ({ ...prev, [campo]: valor }));
  };

  const formatarCelular = (valor) => {
    const numeros = valor.replace(/\D/g, '');
    if (numeros.length <= 10) {
      return numeros.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    }
    return numeros.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
  };

  const validarIdentificacao = () => {
    if (dadosLead.NOME.trim().length < 3) {
      alert('Por favor, digite seu nome completo (mínimo 3 caracteres)');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(dadosLead.EMAIL)) {
      alert('Por favor, digite um email válido');
      return false;
    }
    const celularNumeros = dadosLead.CELULAR.replace(/\D/g, '');
    if (celularNumeros.length < 10) {
      alert('Por favor, digite um celular válido com DDD');
      return false;
    }
    return true;
  };

  const iniciarQuiz = () => {
    if (validarIdentificacao()) {
      setStep('quiz');
    }
  };

  const handleResposta = (valor) => {
    const pergunta = perguntaAtual;
    
    if (pergunta.tipo === 'single') {
      setRespostas(prev => ({ ...prev, [pergunta.id]: valor }));
    } else {
      // Múltipla escolha
      const atual = respostas[pergunta.id] || [];
      if (atual.includes(valor)) {
        setRespostas(prev => ({
          ...prev,
          [pergunta.id]: atual.filter(v => v !== valor)
        }));
      } else {
        if (atual.length < pergunta.max) {
          setRespostas(prev => ({
            ...prev,
            [pergunta.id]: [...atual, valor]
          }));
        }
      }
    }
  };

  const podeAvancar = () => {
    const resposta = respostas[perguntaAtual.id];
    if (perguntaAtual.tipo === 'single') {
      return resposta !== undefined;
    } else {
      return resposta && resposta.length > 0;
    }
  };

  const proximaPergunta = () => {
    if (currentQuestion < totalPerguntas - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      finalizarQuiz();
    }
  };

  const perguntaAnterior = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const finalizarQuiz = async () => {
  setStep('resultado');
  console.log('Enviando para a API...');
  console.log('Dados do Lead:', dadosLead);
  console.log('Respostas:', respostas);

  try {
    const response = await fetch('http://localhost:3001/api/quiz/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        lead: dadosLead,
        respostas: respostas,
      }),
    });

    const result = await response.json();

    if (response.ok) {
      console.log('Dados salvos com sucesso!', result);
    } else {
      console.error('Erro ao salvar os dados:', result);
    }
  } catch (error) {
    console.error('Falha na comunicação com a API:', error);
  }
};

  // Renderização da tela de identificação
  if (step === 'identificacao') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-900 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mb-6">
              <div className="inline-block bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
                <span className="text-cyan-400 font-bold tracking-wider">BLACK NOVEMBER</span>
              </div>
              <h1 className="text-white font-bold mb-2" style={{ fontSize: '1.5rem' }}>
                DA SAÚDE VITALÍCIA
              </h1>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-300">
                <span>COM MESTRE YE</span>
              </div>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
              Diagnóstico Personalizado
            </h2>
            <p className="text-lg text-cyan-300">
              Descubra seu perfil energético segundo a Medicina Tradicional Chinesa
            </p>
          </div>

          {/* Card de Identificação */}
          <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-cyan-500/20">
            <h2 className="text-2xl font-bold text-white mb-2">
              Vamos começar!
            </h2>
            <p className="text-cyan-300 mb-6">
              Preencha seus dados para receber seu diagnóstico personalizado:
            </p>

            <div className="space-y-5">
              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-cyan-300 mb-2">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={dadosLead.NOME}
                  onChange={(e) => handleLeadDataChange('NOME', e.target.value)}
                  placeholder="Digite seu nome completo"
                  className="w-full px-4 py-3 bg-slate-900/50 border-2 border-cyan-500/30 rounded-lg focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 outline-none transition text-white placeholder-gray-500"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-cyan-300 mb-2">
                  E-mail *
                </label>
                <input
                  type="email"
                  value={dadosLead.EMAIL}
                  onChange={(e) => handleLeadDataChange('EMAIL', e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full px-4 py-3 bg-slate-900/50 border-2 border-cyan-500/30 rounded-lg focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 outline-none transition text-white placeholder-gray-500"
                />
              </div>

              {/* Celular */}
              <div>
                <label className="block text-sm font-medium text-cyan-300 mb-2">
                  Celular (WhatsApp) *
                </label>
                <input
                  type="tel"
                  value={dadosLead.CELULAR}
                  onChange={(e) => handleLeadDataChange('CELULAR', formatarCelular(e.target.value))}
                  placeholder="(00) 00000-0000"
                  className="w-full px-4 py-3 bg-slate-900/50 border-2 border-cyan-500/30 rounded-lg focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 outline-none transition text-white placeholder-gray-500"
                />
                <p className="mt-2 text-sm text-gray-400">
                  Enviaremos seu diagnóstico personalizado por WhatsApp
                </p>
              </div>
            </div>

            {/* Botão */}
            <button
              onClick={iniciarQuiz}
              className="w-full mt-8 bg-gradient-to-r from-cyan-500 to-cyan-600 text-slate-900 font-bold py-4 rounded-lg hover:from-cyan-400 hover:to-cyan-500 transition-all transform hover:scale-105 shadow-lg shadow-cyan-500/50"
            >
              INICIAR DIAGNÓSTICO →
            </button>

            {/* Info */}
            <div className="mt-6 p-4 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
              <p className="text-sm text-cyan-300 text-center">
                🔒 Seus dados estão seguros • ⏱️ Tempo estimado: 4 minutos
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Renderização do Quiz
  if (step === 'quiz') {
    const Icon = perguntaAtual.icone;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-900 py-8 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Barra de Progresso */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-cyan-300">
                Pergunta {currentQuestion + 1} de {totalPerguntas}
              </span>
              <span className="text-sm font-bold text-cyan-400">
                {Math.round(progresso)}%
              </span>
            </div>
            <div className="w-full h-3 bg-slate-700/50 rounded-full overflow-hidden border border-cyan-500/20">
              <div 
                className="h-full bg-gradient-to-r from-cyan-400 to-cyan-600 transition-all duration-300 shadow-lg shadow-cyan-500/50"
                style={{ width: `${progresso}%` }}
              />
            </div>
          </div>

          {/* Card da Pergunta */}
          <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8 mb-6 border border-cyan-500/20">
            {/* Badge do Bloco */}
            <div className="flex items-center gap-3 mb-6">
              <div className={`${perguntaAtual.cor} p-2 rounded-lg shadow-lg`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-semibold text-cyan-400 uppercase tracking-wide">
                {perguntaAtual.bloco}
              </span>
            </div>

            {/* Título e Pergunta */}
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
              {perguntaAtual.pergunta}
            </h2>

            {/* Opções */}
            <div className="space-y-3">
              {perguntaAtual.opcoes.map((opcao) => {
                const isSelected = perguntaAtual.tipo === 'single'
                  ? respostas[perguntaAtual.id] === opcao.valor
                  : (respostas[perguntaAtual.id] || []).includes(opcao.valor);

                return (
                  <button
                    key={opcao.valor}
                    onClick={() => handleResposta(opcao.valor)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-cyan-400 bg-cyan-500/20 shadow-lg shadow-cyan-500/30'
                        : 'border-slate-600 bg-slate-900/30 hover:border-cyan-500/50 hover:bg-slate-700/30'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center mt-0.5 ${
                        isSelected 
                          ? 'border-cyan-400 bg-cyan-500' 
                          : 'border-slate-500'
                      }`}>
                        {isSelected && (
                          <CheckCircle className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <div>
                        <span className={`font-medium ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                          {opcao.texto}
                        </span>
                        {opcao.elemento && (
                          <span className="ml-2 text-xs bg-cyan-500/30 text-cyan-300 px-2 py-1 rounded border border-cyan-500/50">
                            {opcao.elemento}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Info múltipla escolha */}
            {perguntaAtual.tipo === 'multiple' && (
              <p className="mt-4 text-sm text-cyan-300 text-center">
                Você pode selecionar até {perguntaAtual.max} opções • 
                Selecionadas: {(respostas[perguntaAtual.id] || []).length}
              </p>
            )}
          </div>

          {/* Botões de Navegação */}
          <div className="flex gap-4">
            {currentQuestion > 0 && (
              <button
                onClick={perguntaAnterior}
                className="flex-1 bg-slate-700/50 text-cyan-300 font-semibold py-4 rounded-lg hover:bg-slate-700 transition flex items-center justify-center gap-2 border border-slate-600"
              >
                <ChevronLeft className="w-5 h-5" />
                Voltar
              </button>
            )}
            
            <button
              onClick={proximaPergunta}
              disabled={!podeAvancar()}
              className={`flex-1 font-bold py-4 rounded-lg transition flex items-center justify-center gap-2 ${
                podeAvancar()
                  ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-slate-900 hover:from-cyan-400 hover:to-cyan-500 shadow-lg shadow-cyan-500/50'
                  : 'bg-slate-700/30 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              {currentQuestion === totalPerguntas - 1 ? 'FINALIZAR' : 'PRÓXIMA'}
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Renderização do Resultado (placeholder)
  if (step === 'resultado') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-900 py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-2xl p-12 border border-cyan-500/20">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full mb-6 shadow-lg shadow-cyan-500/50">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            
            <h1 className="text-3xl font-bold text-white mb-4">
              Diagnóstico Concluído, {dadosLead.NOME.split(' ')[0]}!
            </h1>
            
            <p className="text-lg text-cyan-300 mb-8">
              Estamos processando suas respostas e gerando seu diagnóstico personalizado...
            </p>

            <div className="bg-slate-900/50 rounded-xl p-6 mb-8 border border-cyan-500/20">
              <p className="text-gray-300">
                📧 Enviaremos seu resultado completo para: <br />
                <span className="font-semibold text-cyan-400">{dadosLead.EMAIL}</span>
              </p>
              <p className="text-gray-300 mt-2">
                📱 E também no WhatsApp: <br />
                <span className="font-semibold text-cyan-400">{dadosLead.CELULAR}</span>
              </p>
            </div>

            <div className="p-6 bg-cyan-500/10 rounded-xl border-2 border-cyan-500/30">
              <p className="text-lg font-semibold text-cyan-400 mb-2">
                🎯 Próximo Passo: Evento Exclusivo
              </p>
              <p className="text-white mb-3">
                <span className="font-bold text-cyan-300">03 de Novembro às 20h</span>
              </p>
              <p className="text-gray-300">
                No evento ao vivo, revelaremos a oferta completa do 
                <span className="font-bold text-cyan-400"> Super Combo Black November Vitalícia </span>
                e o método específico para seu perfil!
              </p>
            </div>

            <button
              onClick={() => console.log('Redirecionar para página do evento')}
              className="mt-8 bg-gradient-to-r from-cyan-500 to-cyan-600 text-slate-900 font-bold py-4 px-8 rounded-lg hover:from-cyan-400 hover:to-cyan-500 transition-all transform hover:scale-105 shadow-lg shadow-cyan-500/50"
            >
              QUERO PARTICIPAR DO EVENTO →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default QuizMTC;