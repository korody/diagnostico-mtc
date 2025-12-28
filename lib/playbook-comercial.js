// ========================================
// PLAYBOOK COMERCIAL SIMPLIFICADO
// Para uso do time comercial
// ========================================

const PLAYBOOK_COMERCIAL = {
  
  GUERREIRA_SILENCIOSA: {
    caracteristicas: "Forte, independente, não gosta de depender de ninguém. Decide sozinha. Medo de perder autonomia.",
    
    objecoes: [
      { objecao: "Preciso pensar", resposta: "Claro, você sempre foi independente. Me conta, o que especificamente você precisa avaliar?" },
      { objecao: "Não tenho tempo", resposta: "Justamente por isso você precisa disso. 15min/dia para se tornar sua própria terapeuta e não depender de ninguém." },
      { objecao: "É caro", resposta: "Você gasta R$[CUSTO_MENSAL]/mês. Aqui é R$497 único para autonomia eterna. 30 dias de garantia = risco zero." },
      { objecao: "Preciso falar com a família", resposta: "Você sempre foi independente. Isso é sobre SUA saúde. Quanto mais você adia, mais vai precisar deles no futuro." }
    ],
    
    gatilhos_urgencia: [
      "Se você não cuidar disso agora, daqui anos pode precisar de ajuda para coisas básicas",
      "Quanto mais espera, mais depende de médicos e remédios",
      "A autonomia se conquista HOJE",
      "A decisão é SUA e de mais ninguém"
    ],
    
    perguntas_qualificacao: [
      "O que você mais TEME em relação ao futuro da sua saúde?",
      "Se você pudesse resolver isso sem depender de ninguém, quanto valeria?",
      "Você prefere investir agora e ser independente, ou continuar gastando todo mês?",
      "O que te impediria de começar hoje com 30 dias de garantia?"
    ],
    
    script_fechamento: "Você é forte e independente. Não quer depender de ninguém. Este método te ensina a ser sua própria terapeuta. 15min/dia, em casa. R$497 único vs R$[X]/mês para sempre. 30 dias de garantia. A autonomia é agora. Vamos começar?",
    
    calcularProbabilidade: function(lead) {
      let prob = 60;
      if (lead.autonomia_decisao === 'ALTA') prob += 20;
      if (lead.lead_score >= 70) prob += 15;
      if (lead.investimento_mensal_atual > 300) prob += 10;
      return Math.min(prob, 95);
    }
  },
  
  CIENTISTA_CETICA: {
    caracteristicas: "Analítica, racional, cética. Pesquisa muito antes de decidir. Precisa de provas científicas.",
    
    objecoes: [
      { objecao: "Preciso pesquisar mais", resposta: "Você já pesquisou. A ciência comprova. A pergunta é: vai continuar pesquisando ou vai TESTAR? 30 dias de garantia." },
      { objecao: "Não acredito em MTC", resposta: "Entendo. Por isso temos estudos científicos, metanálises e garantia. Teste você mesma." },
      { objecao: "Já tentei tudo", resposta: "Mas tentou algo baseado em 5 mil anos de ciência empírica + estudos modernos? Com garantia?" },
      { objecao: "É caro", resposta: "Você já gasta R$[X]/mês em coisas que não funcionam. R$497 único, 30 dias de teste, risco zero. A lógica é clara." }
    ],
    
    gatilhos_urgencia: [
      "A ciência mostra: quanto mais cedo fortalecer o [ELEMENTO], mais rápida a recuperação",
      "Você vai continuar pesquisando ou vai TESTAR?",
      "30 dias de garantia = risco ZERO",
      "A decisão racional é clara"
    ],
    
    perguntas_qualificacao: [
      "Quanto tempo você já pesquisou sobre MTC?",
      "O que você precisa ver para acreditar que funciona?",
      "Se eu mostrar estudos + cases + garantia de 30 dias, você começa?",
      "Qual foi o tratamento mais eficaz que você tentou?"
    ],
    
    script_fechamento: "Você é analítica e pesquisou muito. A ciência comprova. Agora: vai continuar PESQUISANDO ou vai TESTAR? 30 dias de garantia = risco ZERO. R$497 único. A lógica é clara. Concorda?",
    
    calcularProbabilidade: function(lead) {
      let prob = 40;
      if (['G','H','I','J'].includes(lead.renda)) prob += 20;
      if (lead.investimento_mensal_atual > 400) prob += 15;
      if (lead.lead_score >= 70) prob += 20;
      if (lead.autonomia_decisao === 'ALTA') prob += 15;
      return Math.min(prob, 85);
    }
  },
  
  MAE_ETERNA: {
    caracteristicas: "Cuida de todos, menos dela. Família em 1º lugar. Sente culpa em gastar consigo. Precisa de permissão emocional.",
    
    objecoes: [
      { objecao: "Não tenho tempo", resposta: "Você acha que não tem tempo para você porque está cuidando de todos. Mas quem vai cuidar deles quando VOCÊ não aguentar mais?" },
      { objecao: "É caro", resposta: "Se fosse para seu filho, você gastaria sem pensar. Por que COM VOCÊ é diferente? Sua saúde vale R$49/mês?" },
      { objecao: "Preciso falar com a família", resposta: "Sua família quer ver você bem. Você merece cuidar de você. É isso que vai te fazer mais presente para eles." },
      { objecao: "Meus filhos precisam", resposta: "Eles precisam de uma MÃE SAUDÁVEL. Você doente não ajuda ninguém." }
    ],
    
    gatilhos_urgencia: [
      "Quem vai cuidar da sua família quando você não aguentar mais?",
      "Você MERECE se cuidar. Não é egoísmo, é responsabilidade",
      "Cuidar de você é cuidar deles",
      "15 minutos por dia. Isso não é pedir muito"
    ],
    
    perguntas_qualificacao: [
      "Quando foi a última vez que você fez algo SÓ PARA VOCÊ?",
      "Se fosse para seu filho, você gastaria sem pensar, né?",
      "O que sua família diria se te vissem bem, disposta, sem dor?",
      "Você acha que cuidar de você é egoísmo?"
    ],
    
    script_fechamento: "Você cuida de todo mundo. Mas quem cuida de você? Cuidar de você NÃO é egoísmo. É o que vai te deixar presente para sua família. R$497 ou R$49/mês. Sua saúde vale isso. Você MERECE. Vamos começar?",
    
    calcularProbabilidade: function(lead) {
      let prob = 55;
      if (lead.autonomia_decisao === 'BAIXA') prob -= 20;
      if (lead.lead_score >= 70) prob += 25;
      if (lead.investimento_mensal_atual < 200) prob -= 10;
      if (lead.custo_mensal_problema > 300) prob += 15;
      return Math.max(20, Math.min(prob, 75));
    }
  },
  
  FENIX_RENASCENTE: {
    caracteristicas: "Busca transformação profunda, propósito, conexão espiritual. Intuitiva, emocional. Decide quando 'sente'.",
    
    objecoes: [
      { objecao: "Não sei se é o momento", resposta: "A fênix não renasce esperando o momento certo. Ela renasce quando DECIDE. E eu sinto que você está pronta." },
      { objecao: "Já fiz terapias e não mudou", resposta: "Porque eram tratamentos superficiais. Aqui é TRANSFORMAÇÃO profunda. Mente-corpo-espírito." },
      { objecao: "Preciso sentir a energia", resposta: "Eu entendo. [ENVIAR VÍDEO DO MESTRE]. Sente essa energia e me diz o que seu coração fala." },
      { objecao: "É caro", resposta: "Isso não é um curso. É um RENASCIMENTO. Quanto vale uma transformação profunda?" }
    ],
    
    gatilhos_urgencia: [
      "Você não está aqui por acaso",
      "A fênix renasce quando DECIDE",
      "Esta é sua oportunidade de transformação",
      "O universo está te mostrando o caminho"
    ],
    
    perguntas_qualificacao: [
      "O que você REALMENTE busca? Não é só a dor, é?",
      "Você sente que tem um propósito maior?",
      "O que seu coração está te dizendo agora?",
      "Você está pronta para renascer?"
    ],
    
    script_fechamento: "Você não está aqui por acaso. Você busca transformação profunda, propósito, renascimento. Este é o caminho. A fênix renasce quando DECIDE. Você está pronta? R$497. Seu renascimento começa agora.",
    
    calcularProbabilidade: function(lead) {
      let prob = 70;
      if (lead.lead_score >= 70) prob += 20;
      if (lead.investimento_mensal_atual > 300) prob += 10;
      if (lead.autonomia_decisao === 'MEDIA') prob -= 10;
      return Math.min(prob, 90);
    }
  }
};

// ========================================
// FUNÇÃO: GERAR RELATÓRIO PARA CALL
// ========================================

function gerarRelatorioCall(lead) {
  const perfil = lead.perfil_comercial;
  const playbook = PLAYBOOK_COMERCIAL[perfil];
  
  if (!playbook) {
    return { erro: "Perfil comercial não encontrado: " + perfil };
  }
  
  const probabilidade = playbook.calcularProbabilidade(lead);
  
  return {
    nome: lead.nome,
    perfil_comercial: perfil,
    lead_score: lead.lead_score,
    probabilidade_fechamento: probabilidade,
    caracteristicas: playbook.caracteristicas,
    objecoes: playbook.objecoes,
    gatilhos_urgencia: playbook.gatilhos_urgencia,
    perguntas_qualificacao: playbook.perguntas_qualificacao,
    script_fechamento: playbook.script_fechamento
  };
}

// ========================================
// EXPORTS
// ========================================

module.exports = {
  PLAYBOOK_COMERCIAL,
  gerarRelatorioCall
};
