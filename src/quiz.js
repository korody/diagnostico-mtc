import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, CheckCircle, Heart, Activity, Brain, Sparkles } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Importar validador de telefone E.164
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';

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
      leadId: getParam('leadId', 'lead_id', 'id'),
      funil: getParam('funil', 'funnel') || 'perpetuo', // 'perpetuo' ou 'lancamento'
      utm_campaign: getParam('utm_campaign') || null
    };
  };

  const urlParams = getUrlParams();

  // Se tem dados na URL, pula identificação e vai direto pro quiz
  const temDadosURL = urlParams.nome && urlParams.email && urlParams.celular;

  // Estados principais - agora com tela de intro
  const [step, setStep] = useState(temDadosURL ? 'intro' : 'identificacao');
  const [funil, setFunil] = useState(urlParams.funil); // 'perpetuo' ou 'lancamento'
  const [utmCampaign] = useState(urlParams.utm_campaign); // capturado uma vez e persistido

  // Estados para controle de etapas e transições
  const [etapaAtual, setEtapaAtual] = useState(0);
  const [mostrandoTransicao, setMostrandoTransicao] = useState(false);

  const [dadosLead, setDadosLead] = useState({
    NOME: urlParams.nome,
    EMAIL: urlParams.email,
    CELULAR: urlParams.celular,
    LEAD_ID: urlParams.leadId,
    PAIS: 'BR', // País padrão
    CELULAR_VALIDO: null, // null=não validado, true=válido, false=inválido
    CELULAR_FORMATADO: '',
    PAIS_NOME: 'Brasil'
  });
  
  const [perguntaAtual, setPerguntaAtual] = useState(0);
  const [respostas, setRespostas] = useState({});
  const [processando, setProcessando] = useState(false);
  const [etapaProcessamento, setEtapaProcessamento] = useState(0);
  const [erro, setErro] = useState('');
  const [resultadoDiagnostico, setResultadoDiagnostico] = useState(null);

  // Estados para campo aberto opcional
  const [campoAberto, setCampoAberto] = useState('');
  const [mostrarCampoAberto, setMostrarCampoAberto] = useState(false);

  // Estado para modal de retomar progresso
  const [mostrarResumeModal, setMostrarResumeModal] = useState(false);
  const [progressoSalvo, setProgressoSalvo] = useState(null);

  // Chave do localStorage
  const STORAGE_KEY = 'quiz_mtc_progress';

  // Carregar progresso salvo ao montar (apenas se não tem dados na URL)
  useEffect(() => {
    if (temDadosURL) return; // Se veio da URL, não carrega localStorage

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Verificar se o progresso é recente (menos de 24h)
        const agora = Date.now();
        const limite = 24 * 60 * 60 * 1000; // 24 horas

        if (parsed.timestamp && (agora - parsed.timestamp) < limite) {
          // Só mostra modal se já passou da identificação
          if (parsed.step === 'quiz' || parsed.step === 'intro') {
            setProgressoSalvo(parsed);
            setMostrarResumeModal(true);
          }
        } else {
          // Progresso expirado, limpar
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (e) {
      console.warn('Erro ao carregar progresso:', e);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [temDadosURL]);

  // Salvar progresso a cada mudança relevante
  useEffect(() => {
    // Só salva se estiver no quiz ou intro
    if (step === 'identificacao' || step === 'resultado') return;

    const progresso = {
      step,
      perguntaAtual,
      etapaAtual,
      respostas,
      dadosLead,
      mostrandoTransicao,
      timestamp: Date.now()
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progresso));
    } catch (e) {
      console.warn('Erro ao salvar progresso:', e);
    }
  }, [step, perguntaAtual, etapaAtual, respostas, dadosLead, mostrandoTransicao]);

  // Função para continuar de onde parou
  const handleContinuarProgresso = () => {
    if (progressoSalvo) {
      setStep(progressoSalvo.step);
      setPerguntaAtual(progressoSalvo.perguntaAtual);
      setEtapaAtual(progressoSalvo.etapaAtual);
      setRespostas(progressoSalvo.respostas || {});
      setDadosLead(progressoSalvo.dadosLead);
      setMostrandoTransicao(progressoSalvo.mostrandoTransicao || false);
    }
    setMostrarResumeModal(false);
  };

  // Função para recomeçar do zero
  const handleRecomecarQuiz = () => {
    localStorage.removeItem(STORAGE_KEY);
    setMostrarResumeModal(false);
    // Mantém na tela de identificação (estado inicial)
  };

  // Limpar progresso quando finaliza o quiz
  const limparProgressoSalvo = () => {
    localStorage.removeItem(STORAGE_KEY);
  };

  // URLs dos funis (carregadas do admin com fallback)
  const [funilUrls, setFunilUrls] = useState({
    perpetuo_url: '/resultados.html', // Fallback
    lancamento_url: 'https://mestre-ye.vercel.app', // Fallback
    campanhas: [] // Lista de campanhas com utm_campaign e url
  });

  // Carregar configuração de funis do painel admin
  useEffect(() => {
    const carregarConfigFunis = async () => {
      try {
        const API_URL = window.location.hostname === 'localhost'
          ? 'http://localhost:3001'
          : '';

        const response = await fetch(`${API_URL}/api/admin/config?key=funis`);
        const data = await response.json();

        if (data.success && data.value) {
          console.log('✅ URLs de funis carregadas do admin:', data.value);
          setFunilUrls(data.value);
        } else {
          console.warn('⚠️ Config de funis não disponível, usando fallback');
        }
      } catch (error) {
        console.warn('⚠️ Erro ao carregar config de funis, usando fallback:', error);
      }
    };

    carregarConfigFunis();
  }, []);

  // Animação progressiva da tela de processamento
  useEffect(() => {
    if (processando) {
      setEtapaProcessamento(0);
      const intervalo = setInterval(() => {
        setEtapaProcessamento(prev => {
          if (prev >= 10) {
            clearInterval(intervalo);
            return prev;
          }
          return prev + 1;
        });
      }, 700); // Cada item aparece a cada 700ms

      return () => clearInterval(intervalo);
    } else {
      setEtapaProcessamento(0);
    }
  }, [processando]);

  // ========================================
  // ESTRUTURA DE ETAPAS E TRANSIÇÕES
  // ========================================

  const etapas = [
    {
      id: 'etapa1',
      titulo: 'Sinais do corpo',
      header: 'Vamos entender quais sinais seu corpo está enviando.',
      subtexto: 'Na Medicina Tradicional Chinesa, toda avaliação começa observando como os sintomas afetam a vida da pessoa.',
      perguntas: ['P1', 'P2', 'P3'],
      transicao: {
        texto: 'Primeira etapa concluída.',
        checklist: ['Intensidade dos sintomas', 'Regiões afetadas', 'Tempo de evolução'],
        proximo: 'Agora vou investigar como sua energia está funcionando.'
      }
    },
    {
      id: 'etapa2',
      titulo: 'Energia e órgãos',
      header: 'Energia e funcionamento dos órgãos',
      subtexto: 'Na Medicina Tradicional Chinesa, diferentes órgãos influenciam energia, digestão, sono, emoções e disposição.',
      perguntas: ['P4', 'P5', 'P6'],
      transicao: {
        texto: 'Na Medicina Tradicional Chinesa, sintomas diferentes podem ter a mesma origem.',
        destaque: 'É por isso que analisamos o conjunto dos sinais, e não apenas um sintoma isolado.',
        icone: '💡'
      }
    },
    {
      id: 'etapa3',
      titulo: 'Emoções',
      header: 'Emoções e energia',
      subtexto: 'Para a Medicina Tradicional Chinesa, emoções também fazem parte da saúde. Elas ajudam a mostrar quais órgãos podem estar sobrecarregados.',
      perguntas: ['P7', 'P8', 'P9'],
      transicao: {
        texto: 'Já conseguimos identificar padrões importantes.',
        proximo: 'Agora preciso entender como isso tem impactado sua vida para personalizar sua orientação.'
      }
    },
    {
      id: 'etapa4',
      titulo: 'Impacto e cuidados',
      header: 'Impacto na sua vida',
      subtexto: 'Entender o que você já tentou e quanto investe nos ajuda a personalizar suas recomendações.',
      perguntas: ['P10', 'P11', 'P12'],
      transicao: {
        texto: 'Quase lá!',
        proximo: 'Mais algumas informações para personalizar seu resultado...'
      }
    },
    {
      id: 'etapa5',
      titulo: 'Seu perfil',
      header: 'Informações do seu perfil',
      subtexto: 'Essas informações nos ajudam a personalizar sua experiência.',
      perguntas: ['P13', 'P14', 'P15', 'P16', 'P17', 'P18'],
      transicao: {
        texto: 'Estamos quase lá!',
        proximo: 'As próximas 2 perguntas vão me ajudar a personalizar melhor minhas recomendações para você.'
      }
    },
    {
      id: 'etapa6',
      titulo: 'Personalização',
      header: 'Finalizando sua consulta',
      subtexto: null,
      perguntas: ['P19', 'P20'],
      transicao: null
    }
  ];

  // ========================================
  // PERGUNTAS DO QUIZ (Nova Estrutura)
  // ========================================

  const perguntas = [
    // ===== ETAPA 1: Sinais do corpo =====
    {
      id: 'P1',
      etapa: 'etapa1',
      texto: 'Pensando na sua rotina de hoje...',
      textoDestaque: 'Como esses sintomas afetam sua vida?',
      tipo: 'single',
      opcoes: [
        { valor: 'A', texto: 'As dores ou desconfortos já limitam bastante meu dia', peso: 5 },
        { valor: 'B', texto: 'Convivo com eles quase todos os dias', peso: 4 },
        { valor: 'C', texto: 'Eles aparecem com frequência e me preocupam', peso: 3 },
        { valor: 'D', texto: 'São leves, mas percebo que meu corpo mudou', peso: 2 },
        { valor: 'E', texto: 'Hoje não tenho sintomas. Quero prevenir problemas futuros', peso: 1 }
      ]
    },
    {
      id: 'P2',
      etapa: 'etapa1',
      texto: 'Em quais regiões seu corpo costuma chamar mais sua atenção?',
      tipo: 'multiple',
      max: 2,
      layout: 'grid',
      opcoes: [
        { valor: 'A', texto: 'Lombar e coluna', elemento: 'RIM' },
        { valor: 'B', texto: 'Joelhos e articulações', elemento: 'RIM' },
        { valor: 'C', texto: 'Pescoço e ombros', elemento: 'FÍGADO' },
        { valor: 'D', texto: 'Digestão ou intestino', elemento: 'BAÇO' },
        { valor: 'E', texto: 'Sono, coração ou ansiedade', elemento: 'CORAÇÃO' },
        { valor: 'F', texto: 'Respiração', elemento: 'PULMÃO' },
        { valor: 'G', texto: 'Zumbido, tontura ou equilíbrio', elemento: 'RIM' }
      ]
    },
    {
      id: 'P3',
      etapa: 'etapa1',
      texto: 'Há quanto tempo seu corpo vem dando esses sinais?',
      tipo: 'single',
      opcoes: [
        { valor: 'A', texto: 'Há mais de 5 anos', peso: 5 },
        { valor: 'B', texto: 'Entre 2 e 5 anos', peso: 4 },
        { valor: 'C', texto: 'Entre 6 meses e 2 anos', peso: 3 },
        { valor: 'D', texto: 'Há poucos meses', peso: 2 },
        { valor: 'E', texto: 'Ainda não tenho sintomas', peso: 1 }
      ]
    },

    // ===== ETAPA 2: Energia e órgãos =====
    {
      id: 'P4',
      etapa: 'etapa2',
      texto: 'Quais destes sinais você também percebe?',
      tipo: 'multiple',
      max: 3,
      layout: 'grid',
      opcoes: [
        { valor: 'A', texto: 'Muito cansaço', elemento: 'RIM' },
        { valor: 'B', texto: 'Mãos e pés frios', elemento: 'RIM' },
        { valor: 'C', texto: 'Sono ruim', elemento: 'CORAÇÃO' },
        { valor: 'D', texto: 'Ansiedade', elemento: 'CORAÇÃO' },
        { valor: 'E', texto: 'Digestão lenta', elemento: 'BAÇO' },
        { valor: 'F', texto: 'Inchaço', elemento: 'BAÇO' },
        { valor: 'G', texto: 'Irritabilidade', elemento: 'FÍGADO' },
        { valor: 'H', texto: 'Zumbido', elemento: 'RIM' },
        { valor: 'I', texto: 'Tontura', elemento: 'RIM' },
        { valor: 'J', texto: 'Nenhum', elemento: null }
      ]
    },
    {
      id: 'P5',
      etapa: 'etapa2',
      texto: 'Em qual período do dia você sente menos energia?',
      tipo: 'single',
      opcoes: [
        { valor: 'A', texto: 'Logo ao acordar' },
        { valor: 'B', texto: 'Durante a manhã' },
        { valor: 'C', texto: 'Depois do almoço' },
        { valor: 'D', texto: 'No fim da tarde' },
        { valor: 'E', texto: 'À noite' },
        { valor: 'F', texto: 'Minha energia costuma ser estável' }
      ]
    },
    {
      id: 'P6',
      etapa: 'etapa2',
      texto: 'O que mais incomoda você atualmente?',
      tipo: 'single',
      layout: 'grid',
      opcoes: [
        { valor: 'A', texto: 'Dor' },
        { valor: 'B', texto: 'Cansaço' },
        { valor: 'C', texto: 'Falta de disposição' },
        { valor: 'D', texto: 'Sono ruim' },
        { valor: 'E', texto: 'Ansiedade' },
        { valor: 'F', texto: 'Digestão' },
        { valor: 'G', texto: 'Rigidez' },
        { valor: 'H', texto: 'Outro' }
      ]
    },

    // ===== ETAPA 3: Emoções =====
    {
      id: 'P7',
      etapa: 'etapa3',
      texto: 'Nos últimos meses...',
      textoDestaque: 'Qual emoção mais tem acompanhado você?',
      tipo: 'single',
      opcoes: [
        { valor: 'A', texto: 'Preocupação constante', elemento: 'BAÇO' },
        { valor: 'B', texto: 'Irritação fácil', elemento: 'FÍGADO' },
        { valor: 'C', texto: 'Tristeza', elemento: 'PULMÃO' },
        { valor: 'D', texto: 'Medo', elemento: 'RIM' },
        { valor: 'E', texto: 'Ansiedade', elemento: 'CORAÇÃO' },
        { valor: 'F', texto: 'Nenhuma dessas', elemento: null }
      ]
    },
    {
      id: 'P8',
      etapa: 'etapa3',
      texto: 'Quando acorda...',
      textoDestaque: 'Como normalmente você se sente?',
      tipo: 'single',
      opcoes: [
        { valor: 'A', texto: 'Descansada' },
        { valor: 'B', texto: 'Ainda cansada' },
        { valor: 'C', texto: 'Sem vontade de levantar' },
        { valor: 'D', texto: 'Já preocupada' },
        { valor: 'E', texto: 'Depende do dia' }
      ]
    },
    {
      id: 'P9',
      etapa: 'etapa3',
      texto: 'Se sua saúde estivesse melhor...',
      textoDestaque: 'O que você voltaria a fazer?',
      tipo: 'single',
      opcoes: [
        { valor: 'A', texto: 'Caminhar' },
        { valor: 'B', texto: 'Viajar' },
        { valor: 'C', texto: 'Brincar com meus netos' },
        { valor: 'D', texto: 'Trabalhar melhor' },
        { valor: 'E', texto: 'Dormir melhor' },
        { valor: 'F', texto: 'Ter mais disposição' }
      ]
    },

    // ===== ETAPA 4: Impacto e cuidados =====
    {
      id: 'P10',
      etapa: 'etapa4',
      texto: 'Se nada mudar...',
      textoDestaque: 'Qual dessas situações mais preocupa você?',
      tipo: 'single',
      opcoes: [
        { valor: 'A', texto: 'Perder minha autonomia', peso: 5 },
        { valor: 'B', texto: 'Continuar convivendo com dor', peso: 4 },
        { valor: 'C', texto: 'Precisar depender da minha família', peso: 4 },
        { valor: 'D', texto: 'Ver minha saúde piorar aos poucos', peso: 3 },
        { valor: 'E', texto: 'Não conseguir aproveitar a aposentadoria', peso: 3 }
      ]
    },
    {
      id: 'P11',
      etapa: 'etapa4',
      texto: 'O que você já tentou fazer para melhorar sua saúde?',
      tipo: 'multiple',
      max: 3,
      layout: 'grid',
      opcoes: [
        { valor: 'A', texto: 'Fisioterapia' },
        { valor: 'B', texto: 'Academia' },
        { valor: 'C', texto: 'Pilates' },
        { valor: 'D', texto: 'Acupuntura' },
        { valor: 'E', texto: 'Massagem' },
        { valor: 'F', texto: 'Suplementos' },
        { valor: 'G', texto: 'Consultas' },
        { valor: 'H', texto: 'Ainda não consegui começar' }
      ]
    },
    {
      id: 'P12',
      etapa: 'etapa4',
      texto: 'Para tentar aliviar esses sintomas, quanto você acredita investir por mês entre consultas, exames, medicamentos, suplementos ou outros cuidados?',
      subtexto: 'Considere remédios, consultas, exames, tratamentos, etc.',
      tipo: 'single',
      opcoes: [
        { valor: 'A', texto: 'Menos de R$ 100', custo: 50 },
        { valor: 'B', texto: 'Entre R$ 100 e R$ 300', custo: 200 },
        { valor: 'C', texto: 'Entre R$ 300 e R$ 500', custo: 400 },
        { valor: 'D', texto: 'Entre R$ 500 e R$ 1.000', custo: 750 },
        { valor: 'E', texto: 'Mais de R$ 1.000', custo: 1200 },
        { valor: 'F', texto: 'Não gasto nada (só uso o plano de saúde)', custo: 0 }
      ]
    },

    // ===== ETAPA 5: Perfil =====
    {
      id: 'P13',
      etapa: 'etapa5',
      texto: 'Qual é a sua faixa etária?',
      tipo: 'single',
      layout: 'grid',
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
      id: 'P14',
      etapa: 'etapa5',
      texto: 'Em qual região você mora?',
      subtexto: 'Isso nos ajuda a personalizar eventos e conteúdos regionais',
      tipo: 'single',
      layout: 'grid',
      opcoes: [
        { valor: 'SP', texto: 'São Paulo' },
        { valor: 'RJ', texto: 'Rio de Janeiro' },
        { valor: 'MG', texto: 'Minas Gerais' },
        { valor: 'RS', texto: 'Rio Grande do Sul' },
        { valor: 'PR', texto: 'Paraná' },
        { valor: 'SC', texto: 'Santa Catarina' },
        { valor: 'BA', texto: 'Bahia' },
        { valor: 'PE', texto: 'Pernambuco' },
        { valor: 'CE', texto: 'Ceará' },
        { valor: 'DF', texto: 'Distrito Federal' },
        { valor: 'GO', texto: 'Goiás' },
        { valor: 'ES', texto: 'Espírito Santo' },
        { valor: 'PA', texto: 'Pará' },
        { valor: 'AM', texto: 'Amazonas' },
        { valor: 'MA', texto: 'Maranhão' },
        { valor: 'MT', texto: 'Mato Grosso' },
        { valor: 'MS', texto: 'Mato Grosso do Sul' },
        { valor: 'PB', texto: 'Paraíba' },
        { valor: 'RN', texto: 'Rio Grande do Norte' },
        { valor: 'AL', texto: 'Alagoas' },
        { valor: 'PI', texto: 'Piauí' },
        { valor: 'SE', texto: 'Sergipe' },
        { valor: 'RO', texto: 'Rondônia' },
        { valor: 'AC', texto: 'Acre' },
        { valor: 'AP', texto: 'Amapá' },
        { valor: 'RR', texto: 'Roraima' },
        { valor: 'TO', texto: 'Tocantins' },
        { valor: 'OUTRO', texto: 'Outro país' }
      ]
    },
    {
      id: 'P15',
      etapa: 'etapa5',
      texto: 'Há quanto tempo você conhece o trabalho do Mestre Ye?',
      tipo: 'single',
      opcoes: [
        { valor: 'A', texto: 'Conheci agora através de amigos ou familiares' },
        { valor: 'B', texto: 'Conheci agora através de anúncios' },
        { valor: 'C', texto: 'Há pouco tempo (1-3 meses)' },
        { valor: 'D', texto: 'Há cerca de 6 meses' },
        { valor: 'E', texto: 'Há bastante tempo (mais de 1 ano)' }
      ]
    },
    {
      id: 'P16',
      etapa: 'etapa5',
      texto: 'Você já é ou foi aluno(a) de algum curso ou evento pago do Mestre Ye?',
      subtexto: 'Cursos online, eventos presenciais, mentorias, etc.',
      tipo: 'single',
      opcoes: [
        { valor: 'A', texto: 'Ainda não sou aluno(a)' },
        { valor: 'B', texto: 'Sim, já fiz curso ou evento pago' }
      ]
    },
    {
      id: 'P17',
      etapa: 'etapa5',
      texto: 'Quando você tem um problema de saúde, o que você costuma fazer primeiro?',
      tipo: 'single',
      opcoes: [
        { valor: 'A', texto: 'Espero alguns dias para ver se melhora naturalmente' },
        { valor: 'B', texto: 'Procuro informações online e leio sobre o assunto' },
        { valor: 'C', texto: 'Continuo com minha rotina normal e deixo para depois' },
        { valor: 'D', texto: 'Paro para refletir sobre o que pode estar causando' }
      ]
    },
    {
      id: 'P18',
      etapa: 'etapa5',
      texto: 'Ao considerar um novo cuidado com sua saúde, o que mais pesa na sua decisão?',
      subtexto: 'Queremos entender o que é mais importante para você',
      tipo: 'single',
      opcoes: [
        { valor: 'A', texto: 'Ver resultados comprovados e experiências de outras pessoas' },
        { valor: 'B', texto: 'Conseguir encaixar na rotina sem prejuízo das outras atividades' },
        { valor: 'C', texto: 'Ter flexibilidade para fazer no meu tempo e do meu jeito' },
        { valor: 'D', texto: 'Sentir que vai realmente fazer diferença duradoura' },
        { valor: 'E', texto: 'Estar alinhado com o momento que estou vivendo' }
      ]
    },

    // ===== ETAPA 6: Personalização =====
    {
      id: 'P19',
      etapa: 'etapa6',
      texto: 'Qual é a sua renda mensal aproximada?',
      subtexto: 'Essa pergunta é importante para eu poder adaptar melhor minhas recomendações para você.',
      tipo: 'single',
      layout: 'grid',
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
      id: 'P20',
      etapa: 'etapa6',
      texto: 'Quando você decide investir em algo importante (como sua saúde), você:',
      tipo: 'single',
      opcoes: [
        { valor: 'A', texto: 'Decido sozinha, não preciso consultar ninguém' },
        { valor: 'B', texto: 'Gosto de ouvir opinião do marido/filhos mas a decisão final é minha' },
        { valor: 'C', texto: 'Preciso conversar com a família antes de decidir' },
        { valor: 'D', texto: 'Depende da aprovação/ajuda financeira da família' }
      ]
    }
  ];

  // Validações
  const validarEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  // Lista de DDDs brasileiros válidos
  const DDDs_VALIDOS = [
    11, 12, 13, 14, 15, 16, 17, 18, 19, // SP
    21, 22, 24, // RJ
    27, 28, // ES
    31, 32, 33, 34, 35, 37, 38, // MG
    41, 42, 43, 44, 45, 46, // PR
    47, 48, 49, // SC
    51, 53, 54, 55, // RS
    61, 62, 63, 64, 65, 66, 67, 68, 69, // Centro-Oeste/Norte
    71, 73, 74, 75, 77, 79, // Nordeste (BA/SE)
    81, 82, 83, 84, 85, 86, 87, 88, 89, // Nordeste (PE/AL/PB/RN/CE/PI)
    91, 92, 93, 94, 95, 96, 97, 98, 99  // Norte (PA/AM/RR/AP/RO/MA)
  ];

  const validarCelular = (celular) => {
    if (!celular) return false;
    const texto = celular.trim();

    // Aceita E.164 (ex: +351917068586, +5511999999999)
    if (texto.startsWith('+')) {
      const cleaned = texto.replace(/\s+/g, '');
      return /^\+\d{8,15}$/.test(cleaned);
    }

    // Caso local brasileiro: EXIGIR DDD válido (10 ou 11 dígitos)
    const raw = texto.replace(/\D/g, '');
    
    // Deve ter 10 ou 11 dígitos
    if (raw.length !== 10 && raw.length !== 11) {
      return false;
    }
    
    // Verificar se DDD é válido
    const ddd = parseInt(raw.substring(0, 2), 10);
    if (!DDDs_VALIDOS.includes(ddd)) {
      return false;
    }
    
    // Para 11 dígitos, deve começar com 9 após o DDD (celular moderno)
    if (raw.length === 11 && !raw.substring(2).startsWith('9')) {
      return false;
    }
    
    // Para 10 dígitos, aceita tanto celular antigo (começa com 6,7,8,9) 
    // quanto fixo (começa com 2,3,4,5)
    // Todos são válidos, sem restrição adicional
    
    return true;
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
      // Remove caracteres especiais, mantém apenas dígitos
      const apenasDigitos = valor.replace(/\D/g, '');
      
      // Pega o país selecionado (padrão BR)
      const pais = dadosLead.PAIS || 'BR';
      
      // Mapa de nomes de países
      const nomesPaises = {
        'BR': 'Brasil',
        'US': 'Estados Unidos',
        'PT': 'Portugal',
        'ES': 'Espanha',
        'AR': 'Argentina',
        'MX': 'México',
        'CO': 'Colômbia',
        'CL': 'Chile'
      };
      
      // Tenta validar o telefone
      let valido = false;
      let formatado = '';
      
      if (apenasDigitos.length >= 8) {
        try {
          const phoneNumber = parsePhoneNumber(apenasDigitos, pais);
          valido = phoneNumber && phoneNumber.isValid();
          if (valido) {
            formatado = phoneNumber.formatInternational(); // Ex: +55 11 99845-7676
          }
        } catch (err) {
          valido = false;
        }
      }
      
      setDadosLead(prev => ({ 
        ...prev, 
        [campo]: apenasDigitos,
        CELULAR_VALIDO: valido,
        CELULAR_FORMATADO: formatado,
        PAIS_NOME: nomesPaises[pais]
      }));
    } else if (campo === 'PAIS') {
      // Quando muda o país, re-valida o telefone
      setDadosLead(prev => {
        const novoDados = { ...prev, [campo]: valor };
        
        // Re-valida telefone com novo país
        if (novoDados.CELULAR) {
          const nomesPaises = {
            'BR': 'Brasil',
            'US': 'Estados Unidos',
            'PT': 'Portugal',
            'ES': 'Espanha',
            'AR': 'Argentina',
            'MX': 'México',
            'CO': 'Colômbia',
            'CL': 'Chile'
          };
          
          try {
            const phoneNumber = parsePhoneNumber(novoDados.CELULAR, valor);
            novoDados.CELULAR_VALIDO = phoneNumber && phoneNumber.isValid();
            novoDados.CELULAR_FORMATADO = novoDados.CELULAR_VALIDO ? phoneNumber.formatInternational() : '';
            novoDados.PAIS_NOME = nomesPaises[valor];
          } catch (err) {
            novoDados.CELULAR_VALIDO = false;
            novoDados.CELULAR_FORMATADO = '';
            novoDados.PAIS_NOME = nomesPaises[valor];
          }
        }
        
        return novoDados;
      });
    } else {
      setDadosLead(prev => ({ ...prev, [campo]: valor }));
    }
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
    if (!dadosLead.CELULAR || dadosLead.CELULAR_VALIDO !== true) {
      const pais = dadosLead.PAIS_NOME || 'Brasil';
      setErro(`Por favor, digite um celular válido para ${pais}. Verifique o número digitado.`);
      return;
    }
    setStep('intro');
  };

  // Handler para começar o quiz após a tela de intro
  const handleComecarConsulta = () => {
    setStep('quiz');
    setPerguntaAtual(0);
    setEtapaAtual(0);
  };

  // Handler para avançar da tela de transição
  const handleAvancarTransicao = () => {
    setMostrandoTransicao(false);
  };

  // Função auxiliar para encontrar a etapa de uma pergunta
  const getEtapaDaPergunta = (perguntaIndex) => {
    const pergunta = perguntas[perguntaIndex];
    if (!pergunta) return null;
    return etapas.findIndex(e => e.id === pergunta.etapa);
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
      const perguntaAtualObj = perguntas[perguntaAtual];
      const proximaPerguntaObj = perguntas[perguntaAtual + 1];

      // Verifica se está mudando de etapa
      if (perguntaAtualObj.etapa !== proximaPerguntaObj.etapa) {
        // Encontra a etapa atual e verifica se tem transição
        const etapaAtualObj = etapas.find(e => e.id === perguntaAtualObj.etapa);
        if (etapaAtualObj && etapaAtualObj.transicao) {
          setMostrandoTransicao(true);
          setEtapaAtual(etapas.findIndex(e => e.id === proximaPerguntaObj.etapa));
        }
      }

      setPerguntaAtual(perguntaAtual + 1);
    } else {
      // Última pergunta - mostrar campo aberto opcional
      setMostrarCampoAberto(true);
    }
  };

  const voltarPergunta = () => {
    if (mostrandoTransicao) {
      setMostrandoTransicao(false);
      return;
    }
    if (perguntaAtual > 0) {
      const perguntaAtualObj = perguntas[perguntaAtual];
      const perguntaAnteriorObj = perguntas[perguntaAtual - 1];

      // Atualiza a etapa se necessário
      if (perguntaAtualObj.etapa !== perguntaAnteriorObj.etapa) {
        setEtapaAtual(etapas.findIndex(e => e.id === perguntaAnteriorObj.etapa));
      }

      setPerguntaAtual(perguntaAtual - 1);
    }
  };

  // Handler para pular ou enviar campo aberto
  const handleFinalizarComCampoAberto = (pular = false) => {
    if (!pular && campoAberto.trim()) {
      // Salva o campo aberto nas respostas
      setRespostas(prev => ({ ...prev, CAMPO_ABERTO: campoAberto.trim() }));
    }
    setMostrarCampoAberto(false);
    finalizarQuiz();
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
      // Converte telefone para E.164 antes de enviar
      let celularE164;
      try {
        const phoneNumber = parsePhoneNumber(dadosLead.CELULAR, dadosLead.PAIS || 'BR');
        
        if (phoneNumber && phoneNumber.isValid()) {
          celularE164 = phoneNumber.format('E.164'); // Ex: +5511963982121
          console.log('✅ Telefone formatado para E.164:', celularE164);
          console.log('📊 Tipo:', phoneNumber.getType(), '| País:', phoneNumber.country);
        } else {
          // Telefone inválido, mas NÃO BLOQUEAR - enviar do jeito que está
          console.warn('⚠️ Telefone não passou na validação, mas enviando mesmo assim');
          celularE164 = '+' + dadosLead.CELULAR.replace(/\D/g, '');
          console.log('📞 Telefone enviado sem validação:', celularE164);
        }
      } catch (err) {
        // Erro ao parsear, mas NÃO BLOQUEAR - enviar número bruto
        console.warn('⚠️ Erro ao formatar telefone, mas enviando mesmo assim:', err.message);
        celularE164 = '+' + dadosLead.CELULAR.replace(/\D/g, '');
        console.log('📞 Telefone enviado sem validação:', celularE164);
      }
      
      const payload = {
        lead: {
          NOME: dadosLead.NOME,
          EMAIL: dadosLead.EMAIL,
          CELULAR: celularE164 // Envia em formato E.164
        },
        respostas: respostas,
        funil: funil, // 'perpetuo' ou 'lancamento'
        utm_campaign: utmCampaign || null
      };
      
      console.log('📞 Telefone formatado para E.164:', celularE164);
      
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
        // Limpar progresso salvo após envio bem-sucedido
        limparProgressoSalvo();

        console.log('✅ QUIZ SALVO COM SUCESSO!');
        console.log('  User ID:', result.user_id);
        console.log('  Novo usuário?', result.is_new_user);
        console.log('  Diagnóstico:', result.diagnostico);
        console.log('  Redirect URL:', result.redirect_url);
        
        // Redirect baseado em utm_campaign (prioridade) ou funil (fallback)
        const baseUrl = window.location.hostname === 'localhost'
          ? 'http://localhost:3001'
          : '';

        let redirectUrl;
        const campanhas = funilUrls.campanhas || [];
        const campanha = utmCampaign ? campanhas.find(c => c.utm_campaign === utmCampaign) : null;

        // Elemento diagnosticado (RIM, FÍGADO, BAÇO, CORAÇÃO, PULMÃO) para URL específica
        const elemento = result.diagnostico && result.diagnostico.elemento;
        // URL específica do elemento → senão URL de destino padrão da campanha
        const urlCampanha = campanha
          ? ((campanha.urls_por_elemento && elemento && campanha.urls_por_elemento[elemento]) || campanha.url)
          : null;

        if (campanha && urlCampanha) {
          // Campanha específica encontrada pelo utm_campaign
          const url = urlCampanha.startsWith('http') ? urlCampanha : `${baseUrl}${urlCampanha}`;
          redirectUrl = `${url}?email=${encodeURIComponent(dadosLead.EMAIL)}`;
        } else if (funil === 'lancamento') {
          // Fallback: funil de lançamento
          const lancamentoUrl = funilUrls.lancamento_url || 'https://mestre-ye.vercel.app';
          redirectUrl = `${lancamentoUrl}?email=${encodeURIComponent(dadosLead.EMAIL)}`;
        } else {
          // Fallback: funil perpétuo
          const perpetuoUrl = funilUrls.perpetuo_url || '/resultados.html';
          const fullPerpetuoUrl = perpetuoUrl.startsWith('http') ? perpetuoUrl : `${baseUrl}${perpetuoUrl}`;
          redirectUrl = `${fullPerpetuoUrl}?email=${encodeURIComponent(dadosLead.EMAIL)}`;
        }

        console.log('🔄 Redirecionando para:', redirectUrl);
        console.log('📊 Funil:', funil);
        console.log('🔗 URLs configuradas:', funilUrls);

        // Aguardar pelo menos 7 segundos na tela de processamento
        // para dar a sensação de análise personalizada
        await new Promise(resolve => setTimeout(resolve, 7000));

        window.location.href = redirectUrl;
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

  // Progresso geral (perguntas respondidas / total)
  const progresso = ((perguntaAtual + 1) / perguntas.length) * 100;

  // Progresso da etapa atual
  const etapaAtualObj = etapas[etapaAtual];
  const perguntasEtapaAtual = etapaAtualObj ? etapaAtualObj.perguntas : [];
  const perguntaAtualObj = perguntas[perguntaAtual];
  const indexNaEtapa = perguntaAtualObj ? perguntasEtapaAtual.indexOf(perguntaAtualObj.id) : 0;
  const progressoEtapa = perguntasEtapaAtual.length > 0 ? ((indexNaEtapa + 1) / perguntasEtapaAtual.length) * 100 : 0;

  // ========================================
  // MODAL DE RETOMAR PROGRESSO
  // ========================================
  if (mostrarResumeModal && progressoSalvo) {
    const perguntasRespondidas = Object.keys(progressoSalvo.respostas || {}).length;
    return (
      <div className="min-h-screen p-4 pt-8 flex items-center justify-center" style={{ background: 'transparent' }}>
        <div className="w-full max-w-md mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl p-8 animate-fade-in text-center">

            {/* Ícone */}
            <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Activity className="w-8 h-8 text-cyan-600" />
            </div>

            {/* Título */}
            <h2 className="text-2xl font-bold text-slate-900 mb-3">
              Continuar de onde parou?
            </h2>

            {/* Info do progresso */}
            <p className="text-slate-600 mb-2">
              Olá, <span className="font-semibold">{progressoSalvo.dadosLead?.NOME?.split(' ')[0] || 'visitante'}</span>!
            </p>
            <p className="text-slate-500 text-sm mb-6">
              Você respondeu {perguntasRespondidas} de {perguntas.length} perguntas.
            </p>

            {/* Barra de progresso visual */}
            <div className="w-full bg-slate-200 rounded-full h-2 mb-8">
              <div
                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(perguntasRespondidas / perguntas.length) * 100}%` }}
              />
            </div>

            {/* Botões */}
            <div className="space-y-3">
              <button
                onClick={handleContinuarProgresso}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg"
              >
                Continuar diagnóstico
              </button>
              <button
                onClick={handleRecomecarQuiz}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium py-3 px-6 rounded-xl transition-all duration-200"
              >
                Recomeçar do início
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render da tela de identificação
if (step === 'identificacao') {
  return (
    <div className="min-h-screen p-4 pt-8" style={{ background: 'transparent' }}>
      <div className="w-full max-w-lg mx-auto">
        
        {/* Popup Card Branco */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 animate-fade-in relative">
          
          {/* Botão de Suporte - Discreto no canto */}
          <a
            href="https://wa.me/5511950879456?text=Olá!%20Estou%20com%20problema%20no%20quiz%20de%20diagnóstico"
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-3 right-3 flex items-center gap-1.5 text-slate-400 hover:text-green-500 transition-colors duration-200 group"
            title="Precisa de ajuda?"
          >
            <span className="text-xs font-medium opacity-70 group-hover:opacity-100">Suporte Técnico</span>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </a>
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mb-6">
              <img 
                src="/images/Logo-Mestre-Ye-Oficial.png" 
                alt="Mestre Ye" 
                className="w-32 h-32 mx-auto object-contain drop-shadow-md"
              />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-3">Anamnese Express da Medicina Tradicional Chinesa</h1>
            <h2 className="text-lg font-semibold bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent mb-4">
              com Mestre Ye
            </h2>
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

              {/* Dropdown de País + Input de Telefone */}
              <div className="flex gap-2">
                {/* Dropdown de País */}
                <select
                  value={dadosLead.PAIS || 'BR'}
                  onChange={(e) => handleInputChange('PAIS', e.target.value)}
                  className="w-36 px-3 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all cursor-pointer text-sm"
                >
                  <option value="BR">🇧🇷 Brasil +55</option>
                  <option value="PT">🇵🇹 Portugal +351</option>
                  <option value="AO">🇦🇴 Angola +244</option>
                  <option value="MZ">🇲🇿 Moçambique +258</option>
                  <option value="CV">🇨🇻 Cabo Verde +238</option>
                  <option value="GW">🇬🇼 Guiné-Bissau +245</option>
                  <option value="ST">🇸� São Tomé +239</option>
                  <option value="TL">🇹🇱 Timor-Leste +670</option>
                  <optgroup label="━━ América do Sul ━━">
                    <option value="AR">🇦🇷 Argentina +54</option>
                    <option value="BO">🇧🇴 Bolívia +591</option>
                    <option value="CL">🇨🇱 Chile +56</option>
                    <option value="CO">🇨🇴 Colômbia +57</option>
                    <option value="EC">🇪🇨 Equador +593</option>
                    <option value="GY">🇬🇾 Guiana +592</option>
                    <option value="PY">🇵🇾 Paraguai +595</option>
                    <option value="PE">🇵🇪 Peru +51</option>
                    <option value="SR">🇸🇷 Suriname +597</option>
                    <option value="UY">🇺🇾 Uruguai +598</option>
                    <option value="VE">🇻🇪 Venezuela +58</option>
                  </optgroup>
                  <optgroup label="━━ América Central ━━">
                    <option value="MX">🇲🇽 México +52</option>
                    <option value="GT">🇬🇹 Guatemala +502</option>
                    <option value="BZ">🇧🇿 Belize +501</option>
                    <option value="SV">🇸🇻 El Salvador +503</option>
                    <option value="HN">🇭🇳 Honduras +504</option>
                    <option value="NI">🇳🇮 Nicarágua +505</option>
                    <option value="CR">🇨🇷 Costa Rica +506</option>
                    <option value="PA">🇵🇦 Panamá +507</option>
                  </optgroup>
                  <optgroup label="━━ Caribe ━━">
                    <option value="CU">🇨🇺 Cuba +53</option>
                    <option value="DO">🇩🇴 Rep. Dominicana +1</option>
                    <option value="PR">🇵🇷 Porto Rico +1</option>
                  </optgroup>
                  <optgroup label="━━ América do Norte ━━">
                    <option value="US">🇺🇸 EUA +1</option>
                    <option value="CA">🇨🇦 Canadá +1</option>
                  </optgroup>
                  <optgroup label="━━ Europa ━━">
                    <option value="ES">🇪🇸 Espanha +34</option>
                    <option value="FR">🇫🇷 França +33</option>
                    <option value="IT">🇮🇹 Itália +39</option>
                    <option value="DE">🇩🇪 Alemanha +49</option>
                    <option value="GB">🇬🇧 Reino Unido +44</option>
                    <option value="CH">🇨🇭 Suíça +41</option>
                  </optgroup>
                  <optgroup label="━━ Ásia ━━">
                    <option value="CN">🇨🇳 China +86</option>
                    <option value="JP">🇯🇵 Japão +81</option>
                    <option value="IN">🇮🇳 Índia +91</option>
                  </optgroup>
                  <optgroup label="━━ Outros ━━">
                    <option value="AU">🇦🇺 Austrália +61</option>
                    <option value="NZ">🇳🇿 Nova Zelândia +64</option>
                    <option value="ZA">🇿🇦 África do Sul +27</option>
                  </optgroup>
                </select>

                {/* Input de Telefone */}
                <input
                  type="tel"
                  value={dadosLead.CELULAR}
                  onChange={(e) => handleInputChange('CELULAR', e.target.value)}
                  placeholder={(dadosLead.PAIS === 'BR' || !dadosLead.PAIS) ? "11 99999-9999" : "Número local"}
                  className={`flex-1 px-4 py-3 bg-slate-50 border rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none transition-all ${
                    dadosLead.CELULAR_VALIDO === false 
                      ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
                      : 'border-slate-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20'
                  }`}
                />
              </div>
              
              {/* Feedback de Validação - só mostra erro se digitou número com 8+ dígitos */}
              {dadosLead.CELULAR && dadosLead.CELULAR.length >= 8 && dadosLead.CELULAR_VALIDO === false && (
                <p className="text-sm text-red-600 mt-2 flex items-center">
                  <span className="mr-1">❌</span>
                  Digite número válido para {dadosLead.PAIS_NOME || 'Brasil'}
                </p>
              )}
              {dadosLead.CELULAR && dadosLead.CELULAR_VALIDO === true && (
                <p className="text-sm text-green-600 mt-2 flex items-center">
                  <span className="mr-1">✅</span>
                  Número válido: {dadosLead.CELULAR_FORMATADO}
                </p>
              )}
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
            <p className="text-slate-500 text-sm">
              🔒 Seus dados estão seguros • ⏱️ Tempo estimado: 5 minutos
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

// ========================================
// TELA DE INTRODUÇÃO (Mestre Ye)
// ========================================
if (step === 'intro') {
  return (
    <div className="min-h-screen p-4 pt-8" style={{ background: 'transparent' }}>
      <div className="w-full max-w-lg mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl p-8 animate-fade-in">

          {/* Foto do Mestre Ye */}
          <div className="text-center mb-6">
            <img
              src="/images/mestre_ye_confra.jpg"
              alt="Mestre Ye"
              className="w-48 h-48 mx-auto object-cover rounded-full drop-shadow-lg mb-4 border-4 border-cyan-100"
            />
          </div>

          {/* Texto de Apresentação */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-4">
              Olá! Eu sou o Mestre Ye.
            </h1>
            <div className="text-slate-600 text-base leading-relaxed space-y-4">
              <p>Há mais de 30 anos estudo a Medicina Tradicional Chinesa.</p>
              <p>Na China aprendemos que o corpo raramente adoece de repente.</p>
              <p>Antes disso, ele envia pequenos sinais.</p>
              <p className="font-medium text-slate-800">
                Dor. Cansaço. Insônia. Rigidez. Ansiedade. Falta de energia.
              </p>
              <p>
                Durante esta consulta vou procurar esses sinais para montar seu{' '}
                <span className="font-semibold text-cyan-600">
                  Mapa de Elementos da Medicina Tradicional Chinesa
                </span>.
              </p>
            </div>
          </div>

          {/* Botão */}
          <button
            onClick={handleComecarConsulta}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 flex items-center justify-center gap-2 transform hover:scale-[1.02]"
          >
            Começar minha consulta
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ========================================
// TELA DE TRANSIÇÃO ENTRE ETAPAS
// ========================================
if (step === 'quiz' && mostrandoTransicao) {
  const etapaAnterior = etapas[etapaAtual - 1] || etapas[etapaAtual];
  const transicao = etapaAnterior?.transicao;

  if (transicao) {
    return (
      <div className="min-h-screen p-4 pt-8" style={{ background: 'transparent' }}>
        <div className="w-full max-w-lg mx-auto">

          {/* Barra de Progresso */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-cyan-500 text-sm font-medium">Etapa {etapaAtual + 1} de {etapas.length}</span>
              <span className="text-cyan-500 text-sm font-bold">{Math.round(progresso)}%</span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 via-cyan-500 to-blue-500 transition-all duration-500"
                style={{ width: `${progresso}%` }}
              />
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-8 animate-fade-in text-center">

            {/* Ícone (se houver) */}
            {transicao.icone && (
              <div className="text-5xl mb-4">{transicao.icone}</div>
            )}

            {/* Checklist (se houver) */}
            {transicao.checklist && (
              <div className="mb-6">
                <p className="text-xl font-bold text-slate-900 mb-4">{transicao.texto}</p>
                <div className="space-y-2">
                  {transicao.checklist.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-center gap-2 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Texto simples (sem checklist) */}
            {!transicao.checklist && (
              <div className="mb-6">
                <p className="text-lg text-slate-700 leading-relaxed">
                  {transicao.texto}
                </p>
                {transicao.destaque && (
                  <p className="text-base text-slate-600 mt-3 italic">
                    {transicao.destaque}
                  </p>
                )}
              </div>
            )}

            {/* Próxima etapa */}
            {transicao.proximo && (
              <p className="text-cyan-600 font-medium mb-6">
                {transicao.proximo}
              </p>
            )}

            {/* Botão Continuar */}
            <button
              onClick={handleAvancarTransicao}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-3 px-8 rounded-xl transition-all duration-200 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 flex items-center justify-center gap-2 mx-auto transform hover:scale-[1.02]"
            >
              Continuar
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }
}

// ========================================
// TELA DE CAMPO ABERTO (Opcional)
// ========================================
if (mostrarCampoAberto) {
  return (
    <div className="min-h-screen p-4 pt-8" style={{ background: 'transparent' }}>
      <div className="w-full max-w-lg mx-auto">

        {/* Barra de Progresso - 100% */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-cyan-500 text-sm font-medium">Quase lá!</span>
            <span className="text-cyan-500 text-sm font-bold">95%</span>
          </div>
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-cyan-500 to-blue-500 transition-all duration-500"
              style={{ width: '95%' }}
            />
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8 animate-fade-in">

          <h2 className="text-xl font-bold text-slate-900 mb-4">
            Antes de concluirmos a avaliação, gostaria de abrir um espaço para você.
          </h2>

          <p className="text-slate-600 mb-6 leading-relaxed">
            Às vezes, existem sintomas, preocupações ou detalhes que não aparecem nas perguntas anteriores,
            mas que podem ser importantes para entender melhor o que você está vivendo.
          </p>

          <label className="block text-slate-800 font-semibold mb-3">
            Existe mais alguma coisa sobre sua saúde que você gostaria que eu soubesse?
          </label>

          <textarea
            value={campoAberto}
            onChange={(e) => setCampoAberto(e.target.value)}
            placeholder="Escreva livremente. Você pode contar sobre sintomas, dores, tratamentos que já tentou, preocupações ou qualquer outro detalhe que considere importante..."
            className="w-full h-32 px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all resize-none mb-6"
          />

          <div className="flex gap-3">
            <button
              onClick={() => handleFinalizarComCampoAberto(true)}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-6 rounded-xl transition-all duration-200"
            >
              Pular
            </button>
            <button
              onClick={() => handleFinalizarComCampoAberto(false)}
              className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 flex items-center justify-center gap-2"
            >
              Finalizar Consulta
              <CheckCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ========================================
// TELA DE PROCESSAMENTO (Enquanto envia)
// ========================================
if (processando) {
  const itensAnalise = [
    'Sintomas principais',
    'Cinco Elementos',
    'Emoções',
    'Possíveis órgãos envolvidos',
    'Tempo de evolução',
    'Perfil energético'
  ];

  const itensResultado = [
    'Qual Elemento merece mais atenção',
    'Quais órgãos podem estar em desequilíbrio',
    'Como seus sintomas podem estar relacionados',
    'Quais primeiros passos fazem sentido para você'
  ];

  // etapaProcessamento: 0-5 = itens análise, 6 = transição, 7-10 = itens resultado
  const mostrarFase2 = etapaProcessamento >= 6;

  return (
    <div className="min-h-screen p-4 pt-8" style={{ background: 'transparent' }}>
      <div className="w-full max-w-lg mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl p-8">

          {/* Fase 1: Cruzando informações */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-6">
              Estou cruzando todas as informações da sua consulta...
            </h2>

            <div className="space-y-3 mb-6">
              {itensAnalise.map((item, index) => (
                <div
                  key={item}
                  className={`flex items-center gap-3 transition-all duration-500 ${
                    index <= etapaProcessamento ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                  }`}
                >
                  <CheckCircle className="w-5 h-5 text-cyan-500" />
                  <span className="text-slate-700">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Barra de progresso */}
          <div className="mb-8">
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${Math.min((etapaProcessamento / 10) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Fase 2: Preparando mapa */}
          <div className={`border-t border-slate-200 pt-6 transition-all duration-500 ${
            mostrarFase2 ? 'opacity-100' : 'opacity-0'
          }`}>
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              Seu Mapa da Medicina Tradicional Chinesa está sendo preparado.
            </h3>

            <p className="text-slate-600 mb-4">Estou organizando as informações para mostrar:</p>

            <div className="space-y-2 text-slate-600">
              {itensResultado.map((item, index) => (
                <p
                  key={item}
                  className={`flex items-start gap-2 transition-all duration-500 ${
                    etapaProcessamento >= 7 + index ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                  }`}
                >
                  <CheckCircle className="w-4 h-4 text-cyan-500 mt-0.5 flex-shrink-0" />
                  {item}
                </p>
              ))}
            </div>
          </div>

          {/* Spinner */}
          <div className="flex justify-center mt-8">
            <div className="w-12 h-12 relative">
              <div className="absolute inset-0 border-4 border-cyan-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-cyan-500 rounded-full border-t-transparent animate-spin"></div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ========================================
// TELA DO QUIZ (Perguntas)
// ========================================
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
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-4 animate-fade-in relative">
          
          {/* Botão de Suporte - Discreto no canto */}
          <a
            href="https://wa.me/5511950879456?text=Olá!%20Estou%20com%20problema%20no%20quiz%20de%20diagnóstico"
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-3 right-3 flex items-center gap-1.5 text-slate-400 hover:text-green-500 transition-colors duration-200 group"
            title="Precisa de ajuda?"
          >
            <span className="text-xs font-medium opacity-70 group-hover:opacity-100">Suporte Técnico</span>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </a>
          
          {/* Header da Etapa (mostra na primeira pergunta de cada etapa) */}
          {(() => {
            const etapaObj = etapas.find(e => e.id === pergunta.etapa);
            const etapaIndex = etapas.findIndex(e => e.id === pergunta.etapa);
            const perguntasDaEtapa = etapaObj ? etapaObj.perguntas : [];
            const isFirstOfEtapa = perguntasDaEtapa[0] === pergunta.id;

            if (isFirstOfEtapa && etapaObj) {
              return (
                <div className="mb-6 -mx-6 -mt-6 px-6 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-t-2xl">
                  <h4 className="text-white text-sm font-bold uppercase tracking-wide mb-1">
                    Etapa {etapaIndex + 1}: {etapaObj.titulo}
                  </h4>
                  {etapaObj.subtexto && (
                    <p className="text-cyan-100 text-sm">
                      {etapaObj.subtexto}
                    </p>
                  )}
                </div>
              );
            }
            return null;
          })()}

          {/* Título da Pergunta */}
          {pergunta.textoDestaque ? (
            <div className="mb-6">
              <p className="text-lg text-slate-600 mb-1">{pergunta.texto}</p>
              <h3 className="text-2xl font-bold text-slate-900 leading-tight">
                {pergunta.textoDestaque}
              </h3>
            </div>
          ) : (
            <h3 className="text-2xl font-bold text-slate-900 mb-6 leading-tight">
              {pergunta.texto}
            </h3>
          )}

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
            pergunta.layout === 'grid'
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
  // Se não tem diagnóstico ainda, mostrar loading
  if (!resultadoDiagnostico) {
    return (
      <div className="min-h-screen p-4 pt-8" style={{ background: 'transparent' }}>
        <div className="w-full max-w-lg mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl p-8 text-center animate-fade-in">
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto mb-4 relative">
                <div className="absolute inset-0 border-4 border-cyan-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-cyan-500 rounded-full border-t-transparent animate-spin"></div>
                <CheckCircle className="absolute inset-0 m-auto w-10 h-10 text-cyan-500" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">✅ Diagnóstico Concluído!</h2>
            <p className="text-xl text-slate-600 mb-6">Processando seus resultados...</p>
          </div>
        </div>
      </div>
    );
  }

  // Dados do diagnóstico
  const diag = resultadoDiagnostico;
  const score = diag.lead_score || 0;
  
  // Mapear arquétipos para emojis e cores
  const arquetiposInfo = {
    'GUERREIRA_SILENCIOSA': { emoji: '🛡️', nome: 'Guerreira Silenciosa', cor: 'bg-purple-100', corTexto: 'text-purple-700' },
    'CIENTISTA_CETICA': { emoji: '🔬', nome: 'Cientista Cética', cor: 'bg-blue-100', corTexto: 'text-blue-700' },
    'MAE_ETERNA': { emoji: '💚', nome: 'Mãe Eterna', cor: 'bg-green-100', corTexto: 'text-green-700' },
    'FENIX_RENASCENTE': { emoji: '🔥', nome: 'Fênix Renascente', cor: 'bg-orange-100', corTexto: 'text-orange-700' }
  };
  
  const arquetipoAtual = arquetiposInfo[diag.perfil_comercial] || arquetiposInfo['MAE_ETERNA'];
  
  // Debug: ver o que está vindo no diagnóstico
  console.log('🔍 Diagnóstico recebido:', {
    intensidade_calculada: diag.intensidade_calculada,
    urgencia_calculada: diag.urgencia_calculada,
    lead_score: diag.lead_score
  });
  
  // Calcular scores individuais (com proteção contra NaN)
  const intensidadeScore = diag.intensidade_calculada ? Math.round((diag.intensidade_calculada / 5) * 100) : 0;
  const urgenciaScore = diag.urgencia_calculada ? Math.round((diag.urgencia_calculada / 5) * 100) : 0;
  const prontidaoScore = score;
  
  // Calcular score de equilíbrio energético (baseado na distribuição dos elementos)
  const totalElementos = Object.values(diag.contagem_elementos || {}).reduce((a, b) => a + b, 0);
  const elementoMax = Math.max(...Object.values(diag.contagem_elementos || {}));
  const equilibrioScore = totalElementos > 0 ? Math.round((1 - (elementoMax / totalElementos)) * 100) : 50;
  
  // Score de investimento em saúde (baseado em P20)
  const investimentoScore = diag.investimento_mensal_atual ? Math.min(Math.round((diag.investimento_mensal_atual / 600) * 100), 100) : 0;
  
  // Score de autonomia
  const autonomiaMap = { 'TOTAL': 100, 'ALTA': 75, 'MEDIA': 50, 'BAIXA': 25 };
  const autonomiaScore = autonomiaMap[diag.autonomia_decisao] || 50;
  
  // Função para determinar badge
  const getBadge = (score) => {
    if (score >= 70) return { text: 'Ponto Forte', color: 'bg-green-100 text-green-700 border-green-300' };
    if (score >= 40) return { text: 'Atenção', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' };
    return { text: 'Prioridade', color: 'bg-red-100 text-red-700 border-red-300' };
  };
  
  // Dados para radar chart (5 elementos)
  const radarData = [
    { elemento: 'Rim', value: diag.contagem_elementos?.RIM || 0 },
    { elemento: 'Fígado', value: diag.contagem_elementos?.FÍGADO || 0 },
    { elemento: 'Baço', value: diag.contagem_elementos?.BAÇO || 0 },
    { elemento: 'Coração', value: diag.contagem_elementos?.CORAÇÃO || 0 },
    { elemento: 'Pulmão', value: diag.contagem_elementos?.PULMÃO || 0 }
  ];
  
  // Dados para bar chart
  const barData = [
    { name: 'Intensidade', value: diag.intensidade_calculada || 0 },
    { name: 'Urgência', value: diag.urgencia_calculada || 0 },
    { name: 'Prontidão', value: Math.round(score / 20) }
  ];

  return (
    <div className="min-h-screen p-4 pt-8" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div className="w-full max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            Resultados do Diagnóstico MTC
          </h1>
          <p className="text-white/90 text-lg">
            Análise completa baseada na Medicina Tradicional Chinesa
          </p>
        </div>

        {/* Grid de Cards de Scores */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Score Geral */}
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center border-2 border-slate-200">
            <div className="text-5xl font-bold text-slate-800 mb-2">{prontidaoScore}%</div>
            <div className="text-slate-600 font-semibold mb-3">Score Geral de Prontidão</div>
            <div className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold border ${getBadge(prontidaoScore).color}`}>
              {getBadge(prontidaoScore).text}
            </div>
          </div>

          {/* Card 2: Intensidade da Dor */}
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center border-2 border-slate-200">
            <div className="text-5xl font-bold text-slate-800 mb-2">{intensidadeScore}%</div>
            <div className="text-slate-600 font-semibold mb-3">Intensidade da Dor</div>
            <div className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold border ${getBadge(intensidadeScore).color}`}>
              {getBadge(intensidadeScore).text}
            </div>
          </div>

          {/* Card 3: Urgência */}
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center border-2 border-slate-200">
            <div className="text-5xl font-bold text-slate-800 mb-2">{urgenciaScore}%</div>
            <div className="text-slate-600 font-semibold mb-3">Urgência de Tratamento</div>
            <div className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold border ${getBadge(urgenciaScore).color}`}>
              {getBadge(urgenciaScore).text}
            </div>
          </div>

          {/* Card 4: Equilíbrio Energético */}
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center border-2 border-slate-200">
            <div className="text-5xl font-bold text-slate-800 mb-2">{equilibrioScore}%</div>
            <div className="text-slate-600 font-semibold mb-3">Equilíbrio Energético</div>
            <div className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold border ${getBadge(equilibrioScore).color}`}>
              {getBadge(equilibrioScore).text}
            </div>
          </div>

          {/* Card 5: Autonomia */}
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center border-2 border-slate-200">
            <div className="text-5xl font-bold text-slate-800 mb-2">{autonomiaScore}%</div>
            <div className="text-slate-600 font-semibold mb-3">Autonomia de Decisão</div>
            <div className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold border ${getBadge(autonomiaScore).color}`}>
              {getBadge(autonomiaScore).text}
            </div>
          </div>

          {/* Card 6: Investimento Atual */}
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center border-2 border-slate-200">
            <div className="text-5xl font-bold text-slate-800 mb-2">{investimentoScore}%</div>
            <div className="text-slate-600 font-semibold mb-3">Investimento em Saúde</div>
            <div className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold border ${getBadge(investimentoScore).color}`}>
              {getBadge(investimentoScore).text}
            </div>
          </div>
        </div>

        {/* Seção de Gráficos */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Comparação por Áreas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bar Chart - Comparação */}
            <div>
              <h3 className="text-lg font-bold text-slate-700 mb-4 text-center">Análise Comparativa</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={[
                  { name: 'Prontidão', value: prontidaoScore },
                  { name: 'Intensidade', value: intensidadeScore },
                  { name: 'Urgência', value: urgenciaScore },
                  { name: 'Equilíbrio', value: equilibrioScore },
                  { name: 'Autonomia', value: autonomiaScore },
                  { name: 'Investimento', value: investimentoScore }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 11 }} angle={-15} textAnchor="end" height={80} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8' }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#5b7c99" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Radar Chart - Visão 360° */}
            <div>
              <h3 className="text-lg font-bold text-slate-700 mb-4 text-center">Visão 360° - Elementos MTC</h3>
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#cbd5e1" />
                  <PolarAngleAxis dataKey="elemento" tick={{ fill: '#475569', fontSize: 12 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fill: '#94a3b8' }} />
                  <Radar name="Elementos" dataKey="value" stroke="#5b7c99" fill="#5b7c99" fillOpacity={0.6} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Análise Detalhada */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-2 mb-6">
            <Brain className="w-6 h-6 text-purple-600" />
            <h2 className="text-2xl font-bold text-slate-900">Análise Detalhada e Recomendações</h2>
          </div>

          {/* Pontos Fortes */}
          {(prontidaoScore >= 70 || intensidadeScore >= 70 || urgenciaScore >= 70 || autonomiaScore >= 70) && (
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-5 mb-4">
              <div className="flex items-start gap-3">
                <div className="bg-green-500 text-white rounded-full p-2 flex-shrink-0">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-green-900 mb-2">✅ Pontos Fortes (70%+)</h3>
                  <p className="text-green-800 font-medium mb-2">Áreas:</p>
                  <ul className="text-green-700 space-y-1 text-sm">
                    {prontidaoScore >= 70 && <li>• <strong>Alta prontidão</strong> para mudança - você está motivada e pronta para agir</li>}
                    {intensidadeScore >= 70 && <li>• <strong>Consciência elevada</strong> sobre os sintomas - sabe exatamente o que precisa resolver</li>}
                    {urgenciaScore >= 70 && <li>• <strong>Senso de urgência</strong> saudável - entende a importância de agir agora</li>}
                    {autonomiaScore >= 70 && <li>• <strong>Autonomia de decisão</strong> - pode tomar decisões sobre sua saúde</li>}
                  </ul>
                  <p className="text-green-800 mt-3 text-sm">
                    <strong>Recomendação:</strong> Use essas vantagens como base para construir sua jornada de transformação!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Prioridades Críticas */}
          {(prontidaoScore < 40 || intensidadeScore < 40 || urgenciaScore < 40 || equilibrioScore < 40) && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-5 mb-4">
              <div className="flex items-start gap-3">
                <div className="bg-red-500 text-white rounded-full p-2 flex-shrink-0">
                  <Activity className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-red-900 mb-2">⚠️ Prioridades Críticas (Abaixo de 40%)</h3>
                  <p className="text-red-800 font-medium mb-2">Áreas que precisam de atenção imediata:</p>
                  <ul className="text-red-700 space-y-1 text-sm">
                    {urgenciaScore < 40 && <li>• <strong>Urgência baixa:</strong> O problema pode estar sendo subestimado. Dores crônicas tendem a piorar com o tempo.</li>}
                    {equilibrioScore < 40 && <li>• <strong>Desequilíbrio energético:</strong> Há concentração excessiva em um elemento. Risco de agravamento.</li>}
                    {intensidadeScore < 40 && <li>• <strong>Sintomas iniciais:</strong> Momento ideal para prevenção antes que se tornem crônicos.</li>}
                  </ul>
                  <p className="text-red-800 mt-3 text-sm font-semibold">
                    <strong>Recomendação:</strong> ATENÇÃO! Invista IMEDIATAMENTE em capacitação e mentoria para essas áreas específicas.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Card do Arquétipo */}
          <div className={`${arquetipoAtual.cor} border-2 border-opacity-30 rounded-xl p-5`}>
            <div className="flex items-start gap-4">
              <div className="text-6xl">{arquetipoAtual.emoji}</div>
              <div className="flex-1">
                <h3 className={`text-xl font-bold ${arquetipoAtual.corTexto} mb-2`}>
                  Arquétipo Comportamental: {arquetipoAtual.nome}
                </h3>
                <p className="text-slate-700 mb-3">
                  Seu perfil foi identificado com base nas suas respostas sobre como você lida com a saúde e toma decisões.
                </p>
                {diag.objecao_principal && (
                  <div className="bg-white/60 rounded-lg p-3 text-sm">
                    <p className="font-semibold text-slate-800 mb-1">Principal Objeção Identificada:</p>
                    <p className="text-slate-700">{diag.objecao_principal}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Plano de Ação Personalizado */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-6 h-6 text-cyan-600" />
            <h2 className="text-2xl font-bold text-slate-900">🎯 Plano de Ação Personalizado</h2>
          </div>

          <div className="space-y-4">
            {/* 30 dias */}
            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-32 text-center">
                <div className="bg-cyan-500 text-white rounded-lg px-4 py-2 font-bold text-sm">
                  Próximos 30 dias
                </div>
              </div>
              <div className="flex-1 bg-cyan-50 border-2 border-cyan-200 rounded-xl p-4">
                <p className="text-cyan-900 font-semibold mb-2">
                  {urgenciaScore >= 70 
                    ? "🚨 Ação Imediata: Iniciar tratamento agora"
                    : "📋 Avaliação inicial e diagnóstico presencial"}
                </p>
                <p className="text-cyan-800 text-sm">
                  {urgenciaScore >= 70
                    ? "Sua urgência está alta. Recomendamos começar imediatamente com sessões intensivas para aliviar os sintomas mais graves."
                    : "Agende uma consulta presencial com especialista para diagnóstico detalhado e plano personalizado."}
                </p>
              </div>
            </div>

            {/* 90 dias */}
            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-32 text-center">
                <div className="bg-blue-500 text-white rounded-lg px-4 py-2 font-bold text-sm">
                  Próximos 90 dias
                </div>
              </div>
              <div className="flex-1 bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <p className="text-blue-900 font-semibold mb-2">
                  🎯 Implementar sistema completo de práticas diárias
                </p>
                <p className="text-blue-800 text-sm">
                  Estabelecer rotina de Qi Gong, acupuntura e fitoterapia. Meta: {intensidadeScore >= 70 ? "reduzir dor em 50%" : "fortalecer energia vital e prevenir agravamento"}.
                </p>
              </div>
            </div>

            {/* 6 meses */}
            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-32 text-center">
                <div className="bg-purple-500 text-white rounded-lg px-4 py-2 font-bold text-sm">
                  Meta 6 meses
                </div>
              </div>
              <div className="flex-1 bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
                <p className="text-purple-900 font-semibold mb-2">
                  🌟 Transformação completa e consolidação
                </p>
                <p className="text-purple-800 text-sm">
                  {prontidaoScore >= 80 
                    ? "Consolidar resultados e tornar-se referência. Preparar-se para ensinar outros."
                    : "Estabelecer equilíbrio energético sustentável e autonomia nos cuidados diários."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Próximos Passos Estratégicos */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl p-8 text-white">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold mb-3">🎯 Próximos Passos Estratégicos</h2>
            <p className="text-white/80 text-lg">Por que agir AGORA é crucial para seu sucesso:</p>
          </div>

          <div className="space-y-4 mb-8">
            <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/20">
              <div className="flex items-start gap-3">
                <div className="text-2xl">🔥</div>
                <div>
                  <p className="font-bold mb-1">Janela de Oportunidade LIMITADA:</p>
                  <p className="text-white/90 text-sm">
                    Problemas crônicos não tratados tendem a se agravar. Quem age primeiro, previne complicações futuras e economiza em tratamentos mais caros.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/20">
              <div className="flex items-start gap-3">
                <div className="text-2xl">💰</div>
                <div>
                  <p className="font-bold mb-1">Custo da Inação:</p>
                  <p className="text-white/90 text-sm">
                    Cada mês sem tratamento adequado pode significar agravamento dos sintomas e R$ 30k a R$ 100k deixados na mesa em qualidade de vida perdida.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/20">
              <div className="flex items-start gap-3">
                <div className="text-2xl">🎁</div>
                <div>
                  <p className="font-bold mb-1">Momento Ideal:</p>
                  <p className="text-white/90 text-sm">
                    Seus {prontidaoScore}% de prontidão indicam que você está no momento perfeito para começar. Aproveite essa motivação!
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/20">
              <div className="flex items-start gap-3">
                <div className="text-2xl">🏆</div>
                <div>
                  <p className="font-bold mb-1">Vantagem Competitiva:</p>
                  <p className="text-white/90 text-sm">
                    Mulheres que dominam a Medicina Tradicional Chinesa vivem com mais qualidade, energia e vitalidade. Os 5% que agem vivem de resultado, não de esforço.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-center text-white text-lg font-semibold italic mb-6">
            A pergunta não é SE vai dar certo... é QUANTO você vai deixar de ganhar esperando o "momento perfeito".
          </p>
        </div>

        {/* Ofertas Personalizadas */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-slate-900 mb-6 text-center">
            Soluções Recomendadas para Você
          </h3>
          
          {score >= 80 ? (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Sparkles className="w-8 h-8 text-purple-600" />
                  <h4 className="text-xl font-bold text-purple-900">Programa PREVENTIVA Premium</h4>
                </div>
                <p className="text-slate-700 mb-4">
                  Baseado no seu score de {score}%, você é candidata ideal para nosso programa completo de transformação.
                </p>
                <div className="text-3xl font-bold text-purple-600 mb-2">R$ 497/mês</div>
                <ul className="space-y-2 text-sm text-slate-600 mb-4">
                  <li>✅ Acompanhamento individualizado com Mestre Ye</li>
                  <li>✅ Sessões semanais ao vivo</li>
                  <li>✅ Grupo VIP exclusivo</li>
                  <li>✅ Resultados garantidos em 90 dias</li>
                </ul>
              </div>
            </div>
          ) : score >= 50 ? (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border-2 border-cyan-200 rounded-xl p-6">
                <h4 className="text-xl font-bold text-cyan-900 mb-3">Programa Semestral + Produtos Focados</h4>
                <p className="text-slate-700 mb-4">
                  Para seu perfil (score {score}%), recomendamos o programa de 6 meses com produtos específicos para {diag.elemento_principal}.
                </p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-white rounded-lg p-3 border-2 border-cyan-200">
                    <div className="font-bold text-cyan-700">Programa Semestral</div>
                    <div className="text-2xl font-bold text-cyan-600">R$ 297/mês</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border-2 border-cyan-200">
                    <div className="font-bold text-cyan-700">+ Produtos MTC</div>
                    <div className="text-2xl font-bold text-cyan-600">R$ 197/mês</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6">
                <h4 className="text-xl font-bold text-green-900 mb-3">Workshop Intensivo de 3 Dias</h4>
                <p className="text-slate-700 mb-4">
                  Perfeito para começar sua jornada! Aprenda as bases do Qi Gong e técnicas essenciais.
                </p>
                <div className="text-3xl font-bold text-green-600 mb-2">R$ 497 <span className="text-lg text-slate-600">(pagamento único)</span></div>
                <p className="text-sm text-slate-600">
                  Após o workshop, você pode migrar para programas mais avançados com desconto especial.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* CTAs Finais */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="https://digital.mestreye.com/chat"
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-6 px-8 rounded-xl transition-all duration-200 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 flex items-center justify-center gap-3 transform hover:scale-[1.02]"
          >
            <Brain className="w-7 h-7" />
            <div className="text-left">
              <div className="text-sm opacity-90">Continuar com</div>
              <div className="text-xl">Mestre Ye Digital (IA)</div>
            </div>
          </a>

          <a
            href="https://wa.me/5511950879456?text=Olá!%20Finalizei%20meu%20diagnóstico%20e%20gostaria%20de%20falar%20com%20um%20especialista"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white hover:bg-slate-50 text-slate-900 font-bold py-6 px-8 rounded-xl transition-all duration-200 border-2 border-slate-300 hover:border-slate-400 shadow-lg flex items-center justify-center gap-3 transform hover:scale-[1.02]"
          >
            <svg className="w-7 h-7 text-green-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            <div className="text-left">
              <div className="text-sm opacity-70">Falar com</div>
              <div className="text-xl">Especialista Humano</div>
            </div>
          </a>
        </div>

        {/* Footer */}
        <div className="text-center py-6">
          <p className="text-white/90 text-sm">
            💚 Seus dados foram salvos com segurança • Você pode acessar este diagnóstico a qualquer momento
          </p>
        </div>

      </div>
    </div>
  );
}

  return null;
};

export default QuizMTC;
