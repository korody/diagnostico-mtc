import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, CheckCircle, Heart, Activity, Brain, Sparkles } from 'lucide-react';

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
    
    // Deve ter 10 (fixo) ou 11 (celular) dígitos
    if (raw.length !== 10 && raw.length !== 11) {
      return false;
    }
    
    // Verificar se DDD é válido
    const ddd = parseInt(raw.substring(0, 2), 10);
    if (!DDDs_VALIDOS.includes(ddd)) {
      return false;
    }
    
    // Para 11 dígitos, deve começar com 9 após o DDD
    if (raw.length === 11 && !raw.substring(2).startsWith('9')) {
      return false;
    }
    
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
        celularE164 = phoneNumber.format('E.164'); // Ex: +5511998457676
      } catch (err) {
        console.error('❌ Erro ao formatar telefone para E.164:', err);
        throw new Error('Número de telefone inválido');
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
        <div className="bg-white rounded-3xl shadow-2xl p-8 animate-fade-in relative">
          
          {/* Botão de Suporte - Canto Superior Direito DENTRO do card */}
          <a
            href="https://wa.me/5511998457676?text=Olá!%20Estou%20com%20problema%20no%20quiz%20de%20diagnóstico"
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-4 right-4 bg-green-500 hover:bg-green-600 text-white rounded-full p-2 shadow-md transition-all duration-200 hover:scale-110"
            title="Precisa de ajuda? Fale conosco no WhatsApp"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </a>
          
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

              {/* Dropdown de País + Input de Telefone */}
              <div className="flex gap-2">
                {/* Dropdown de País */}
                <select
                  value={dadosLead.PAIS || 'BR'}
                  onChange={(e) => handleInputChange('PAIS', e.target.value)}
                  className="w-36 px-3 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all cursor-pointer text-sm"
                >
                  <option value="BR">🇧🇷 Brasil +55</option>
                  <option value="PT">�� Portugal +351</option>
                  <option value="AO">🇦🇴 Angola +244</option>
                  <option value="MZ">🇲🇿 Moçambique +258</option>
                  <option value="CV">🇨🇻 Cabo Verde +238</option>
                  <option value="GW">🇬🇼 Guiné-Bissau +245</option>
                  <option value="ST">�🇹 São Tomé +239</option>
                  <option value="TL">🇹🇱 Timor-Leste +670</option>
                  <optgroup label="━━ América do Sul ━━">
                    <option value="AR">🇦🇷 Argentina +54</option>
                    <option value="BO">🇧🇴 Bolívia +591</option>
                    <option value="CL">🇨🇱 Chile +56</option>
                    <option value="CO">🇨🇴 Colômbia +57</option>
                    <option value="EC">🇪� Equador +593</option>
                    <option value="GY">🇬🇾 Guiana +592</option>
                    <option value="PY">🇵🇾 Paraguai +595</option>
                    <option value="PE">🇵🇪 Peru +51</option>
                    <option value="SR">�🇷 Suriname +597</option>
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
                    <option value="PA">�🇦 Panamá +507</option>
                  </optgroup>
                  <optgroup label="━━ Caribe ━━">
                    <option value="CU">🇨� Cuba +53</option>
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
          
          {/* Botão de Suporte - Canto Superior Direito DENTRO do card */}
          <a
            href="https://wa.me/5511998457676?text=Olá!%20Estou%20com%20problema%20no%20quiz%20de%20diagnóstico"
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-4 right-4 bg-green-500 hover:bg-green-600 text-white rounded-full p-2 shadow-md transition-all duration-200 hover:scale-110"
            title="Precisa de ajuda? Fale conosco no WhatsApp"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
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