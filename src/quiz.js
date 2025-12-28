import React, { useState } from 'react';
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
    LEAD_ID: urlParams.leadId,
    PAIS: 'BR', // País padrão
    CELULAR_VALIDO: null, // null=não validado, true=válido, false=inválido
    CELULAR_FORMATADO: '',
    PAIS_NOME: 'Brasil'
  });
  
  const [perguntaAtual, setPerguntaAtual] = useState(0);
  const [respostas, setRespostas] = useState({});
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState('');
  const [resultadoDiagnostico, setResultadoDiagnostico] = useState(null);

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
      texto: 'Você já é ou foi aluno(a) de algum curso ou evento pago do Mestre Ye?',
      subtexto: 'Cursos online, eventos presenciais, mentorias, etc.',
      tipo: 'single',
      opcoes: [
        { valor: 'A', texto: 'Ainda não sou aluno(a)' },
        { valor: 'B', texto: 'Sim, já fiz curso ou evento pago' }
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
    },
    {
      id: 'P17',
      texto: 'Em qual região você mora?',
      subtexto: 'Isso nos ajuda a personalizar eventos e conteúdos regionais',
      tipo: 'single',
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
      id: 'P14',
      texto: 'Quando você tem um problema de saúde, geralmente o que você FAZ primeiro?',
      tipo: 'single',
      opcoes: [
        { 
          valor: 'A', 
          texto: 'Espero alguns dias para ver se melhora naturalmente'
        },
        { 
          valor: 'B', 
          texto: 'Procuro informações online e leio sobre o assunto'
        },
        { 
          valor: 'C', 
          texto: 'Continuo com minha rotina normal e deixo para depois'
        },
        { 
          valor: 'D', 
          texto: 'Paro para refletir sobre o que pode estar causando'
        }
      ]
    },
    {
      id: 'P16',
      texto: 'Ao considerar um novo cuidado com sua saúde, o que mais pesa na sua decisão?',
      subtexto: 'Queremos entender o que é mais importante para você',
      tipo: 'single',
      opcoes: [
        { 
          valor: 'A', 
          texto: 'Ver resultados comprovados e experiências de outras pessoas'
        },
        { 
          valor: 'B', 
          texto: 'Conseguir encaixar na rotina sem prejuízo das outras atividades'
        },
        { 
          valor: 'C', 
          texto: 'Ter flexibilidade para fazer no meu tempo e do meu jeito'
        },
        { 
          valor: 'D', 
          texto: 'Sentir que vai realmente fazer diferença duradoura'
        },
        { 
          valor: 'E', 
          texto: 'Estar alinhado com o momento que estou vivendo'
        }
      ]
    },
    {
      id: 'P19',
      texto: 'Quando você decide investir em algo importante (como sua saúde), você:',
      tipo: 'single',
      opcoes: [
        { 
          valor: 'A', 
          texto: 'Decido sozinha, não preciso consultar ninguém'
        },
        { 
          valor: 'B', 
          texto: 'Gosto de ouvir opinião do marido/filhos mas a decisão final é minha'
        },
        { 
          valor: 'C', 
          texto: 'Preciso conversar com a família antes de decidir'
        },
        { 
          valor: 'D', 
          texto: 'Depende da aprovação/ajuda financeira da família'
        }
      ]
    },
    {
      id: 'P20',
      texto: 'Atualmente, você já investe em cuidados com sua saúde além do plano de saúde?',
      subtexto: 'Ex: academia, terapias, suplementos, consultas particulares',
      tipo: 'multiple',
      max: 3,
      opcoes: [
        { 
          valor: 'A', 
          texto: 'Fisioterapia ou quiropraxia'
        },
        { 
          valor: 'B', 
          texto: 'Academia, pilates ou personal'
        },
        { 
          valor: 'C', 
          texto: 'Terapias alternativas (acupuntura, massagem)'
        },
        { 
          valor: 'D', 
          texto: 'Suplementos, vitaminas'
        },
        { 
          valor: 'E', 
          texto: 'Consultas médicas/exames particulares'
        },
        { 
          valor: 'F', 
          texto: 'Não invisto em nada além do plano de saúde'
        }
      ]
    },
    {
      id: 'P21',
      texto: 'Quanto você gasta POR MÊS para lidar com esse problema de saúde?',
      subtexto: 'Considere remédios, consultas, exames, tratamentos, etc.',
      tipo: 'single',
      opcoes: [
        { 
          valor: 'A', 
          texto: 'Menos de R$ 100',
          custo: 50
        },
        { 
          valor: 'B', 
          texto: 'Entre R$ 100 e R$ 300',
          custo: 200
        },
        { 
          valor: 'C', 
          texto: 'Entre R$ 300 e R$ 500',
          custo: 400
        },
        { 
          valor: 'D', 
          texto: 'Entre R$ 500 e R$ 1.000',
          custo: 750
        },
        { 
          valor: 'E', 
          texto: 'Mais de R$ 1.000',
          custo: 1200
        },
        { 
          valor: 'F', 
          texto: 'Não gasto nada (só uso o plano de saúde)',
          custo: 0
        }
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
        respostas: respostas
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
        console.log('✅ QUIZ SALVO COM SUCESSO!');
        console.log('  User ID:', result.user_id);
        console.log('  Novo usuário?', result.is_new_user);
        console.log('  Diagnóstico:', result.diagnostico);
        console.log('  Redirect URL:', result.redirect_url);
        
        // Redirect imediato para página de resultados
        const baseUrl = window.location.hostname === 'localhost'
          ? 'http://localhost:3001'
          : '';
        const redirectUrl = `${baseUrl}/resultados.html?email=${encodeURIComponent(dadosLead.EMAIL)}`;
        console.log('🔄 Redirecionando para:', redirectUrl);
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

  const progresso = ((perguntaAtual + 1) / perguntas.length) * 100;

  // Render da tela de identificação
  // Render da tela de identificação
if (step === 'identificacao') {
  return (
    <div className="min-h-screen p-4 pt-8" style={{ background: 'transparent' }}>
      <div className="w-full max-w-lg mx-auto">
        
        {/* Popup Card Branco */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 animate-fade-in relative">
          
          {/* Botão de Suporte - Discreto no canto */}
          <a
            href="https://wa.me/5511998457676?text=Olá!%20Estou%20com%20problema%20no%20quiz%20de%20diagnóstico"
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
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-4 animate-fade-in relative">
          
          {/* Botão de Suporte - Discreto no canto */}
          <a
            href="https://wa.me/5511998457676?text=Olá!%20Estou%20com%20problema%20no%20quiz%20de%20diagnóstico"
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
            pergunta.id === 'P10' || pergunta.id === 'P11' || pergunta.id === 'P17'
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
            href="https://wa.me/5511998457676?text=Olá!%20Finalizei%20meu%20diagnóstico%20e%20gostaria%20de%20falar%20com%20um%20especialista"
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
