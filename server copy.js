const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Criar cliente Supabase
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_KEY
);

// ========================================
// SISTEMA DE DIAGNOSTICO MTC
// ========================================

const MAPEAMENTO_ELEMENTOS = {
  P2: {
    A: 'RIM', B: 'RIM', C: 'FIGADO', D: 'BACO', E: 'CORACAO', F: 'PULMAO'
  },
  P4: {
    A: 'RIM', B: 'RIM', C: 'CORACAO', D: 'BACO', E: 'FIGADO', F: 'PULMAO'
  },
  P5: {
    A: 'FIGADO', B: 'BACO', C: 'PULMAO', D: 'RIM', E: 'CORACAO', F: 'NEUTRO'
  }
};

const DIAGNOSTICOS = {
  RIM: {
    nome: 'Elemento ÁGUA (Rins)',
    arquetipo: 'A Sábia',
    mensagem: (nome) => `Diagnóstico Personalizado de ${nome}

🌊 DIAGNÓSTICO: Desequilíbrio no Elemento ÁGUA (Rins)

O que seu corpo está dizendo:
Seus sintomas de dores lombares, fraqueza nas pernas e sensação de insegurança não são coincidência. Na Medicina Tradicional Chinesa, isso indica que seu elemento ÁGUA está enfraquecido. Os Rins são considerados a raiz da vida - eles guardam nossa essência vital (Jing) e governam nossa força, vitalidade e coragem.

Por que isso está acontecendo:
O elemento Água se enfraquece por excesso de trabalho, estresse prolongado, falta de descanso adequado e, principalmente, por não nutrir a si mesma. Você provavelmente passou anos cuidando dos outros e esqueceu de reabastecer sua própria fonte de energia.

A boa notícia:
✨ Você deu o PRIMEIRO PASSO ao identificar esse desequilíbrio! Muitas pessoas vivem anos sem entender o que está acontecendo com seu corpo. Agora você tem um MAPA claro do que precisa ser fortalecido.

O que você pode fazer:
Os Rins respondem MUITO bem às práticas de Qi Gong específicas para o elemento Água. Com os movimentos certos, você pode:
• Fortalecer a região lombar e eliminar as dores
• Recuperar a vitalidade e energia profunda
• Sentir-se mais segura e confiante
• Dormir melhor e acordar com disposição

🎯 PRÓXIMO PASSO ESSENCIAL:
No evento Black November da Saúde Vitalícia, o Mestre Ye vai revelar COMO VOCÊ PODE implementar essas práticas transformadoras de Qi Gong no seu dia a dia. Você vai descobrir o caminho completo para fortalecer seu elemento Água - com um programa estruturado que cabe na sua rotina e funciona para o RESTO DA VIDA.

Este é o momento de conhecer a solução definitiva para sua saúde vitalícia. Seu corpo está pedindo essa transformação.`
  },
  
  FIGADO: {
    nome: 'Elemento MADEIRA (Fígado)',
    arquetipo: 'A Guerreira',
    mensagem: (nome) => `Diagnóstico Personalizado de ${nome}

🌳 DIAGNÓSTICO: Desequilíbrio no Elemento MADEIRA (Fígado)

O que seu corpo está dizendo:
A tensão constante nos ombros, pescoço e mandíbula, junto com a irritabilidade e impaciência, são sinais claros de que seu elemento MADEIRA está congestionado. Na Medicina Tradicional Chinesa, o Fígado governa o fluxo livre de energia (Qi) pelo corpo. Quando esse fluxo fica bloqueado, você sente pressão, rigidez e explosões emocionais.

Por que isso está acontecendo:
O elemento Madeira se congestiona quando guardamos raiva, frustração e estresse sem liberar. É como uma represa que vai acumulando pressão até transbordar. Você provavelmente é do tipo que aguenta firme, mas seu corpo está mostrando que precisa SOLTAR essa energia estagnada.

A boa notícia:
✨ Você acabou de dar o PRIMEIRO PASSO rumo à sua libertação! Reconhecer que há energia bloqueada já é meio caminho andado. Agora você sabe que não é fraqueza - é apenas energia precisando fluir.

O que você pode fazer:
O Fígado ADORA movimento e flexibilidade. Com as práticas corretas de Qi Gong, você pode:
• Liberar a tensão acumulada nos ombros e pescoço
• Transformar a irritabilidade em calma interior
• Recuperar a flexibilidade física e emocional
• Sentir leveza e paz que você nem lembrava que existiam

🎯 PRÓXIMO PASSO ESSENCIAL:
No evento Black November da Saúde Vitalícia, o Mestre Ye vai apresentar a SOLUÇÃO COMPLETA para desbloquear seu elemento Madeira. Você vai entender como levar essas práticas transformadoras para sua casa - com um programa que se encaixa na sua vida e libera essa tensão acumulada para SEMPRE.

Seu corpo está pronto para fluir novamente. Descubra como no evento do Mestre Ye.`
  },
  
  BACO: {
    nome: 'Elemento TERRA (Baço)',
    arquetipo: 'A Cuidadora',
    mensagem: (nome) => `Diagnóstico Personalizado de ${nome}

🌍 DIAGNÓSTICO: Desequilíbrio no Elemento TERRA (Baço/Pâncreas)

O que seu corpo está dizendo:
O cansaço profundo, problemas digestivos e preocupação excessiva que você sente são sinais de que seu elemento TERRA está esgotado. Na Medicina Tradicional Chinesa, o Baço é responsável por transformar alimentos em energia (Qi) e pensamentos em clareza. Quando ele está fraco, você se sente exausta e mentalmente sobrecarregada.

Por que isso está acontecendo:
O elemento Terra se enfraquece quando cuidamos demais dos outros e esquecemos de nos nutrir. Você é aquela que sempre está disponível para todos, mas raramente reserva tempo para reabastecer sua própria energia. Seu Baço está literalmente gritando por autocuidado.

A boa notícia:
✨ Você deu o PRIMEIRO PASSO ao reconhecer que precisa de cuidado! Esta é uma VITÓRIA importante - você está escolhendo VOCÊ. E a melhor parte? Com as práticas certas, você pode recuperar sua energia sem precisar mudar toda sua rotina.

O que você pode fazer:
O Baço responde maravilhosamente às práticas de Qi Gong que fortalecem o centro energético (Dan Tian). Com os exercícios certos, você pode:
• Recuperar sua energia vital e disposição
• Melhorar digestão e absorção de nutrientes
• Acalmar os pensamentos repetitivos
• Sentir-se nutrida e completa por dentro

🎯 PRÓXIMO PASSO ESSENCIAL:
No evento Black November da Saúde Vitalícia, o Mestre Ye vai revelar o CAMINHO COMPLETO para fortalecer seu elemento Terra. Você vai descobrir como essas práticas ancestrais podem se tornar parte da sua rotina diária - transformando seu cansaço em VITALIDADE que dura a vida toda.

Você merece se sentir cheia de energia todos os dias. Conheça a solução no evento do Mestre Ye.`
  },
  
  CORACAO: {
    nome: 'Elemento FOGO (Coração)',
    arquetipo: 'A Comunicadora',
    mensagem: (nome) => `Diagnóstico Personalizado de ${nome}

🔥 DIAGNÓSTICO: Desequilíbrio no Elemento FOGO (Coração)

O que seu corpo está dizendo:
A insônia, ansiedade, palpitações e agitação mental constante são sinais de que seu elemento FOGO está desequilibrado. Na Medicina Tradicional Chinesa, o Coração abriga o Shen (espírito/consciência). Quando o Fogo está desregulado, é como se a chama interna estivesse descontrolada - muito agitada, impossível de acalmar.

Por que isso está acontecendo:
O elemento Fogo se desregula por excesso de estímulos mentais, preocupações constantes e falta de momentos de paz verdadeira. Seu Coração está hiperativo, processando mil pensamentos ao mesmo tempo, sem conseguir descansar. É como deixar todas as luzes da casa acesas 24h - eventualmente, o sistema sobrecarrega.

A boa notícia:
✨ Você deu o PRIMEIRO PASSO ao buscar entender o que está acontecendo! Reconhecer que sua mente precisa de paz já é uma GRANDE VITÓRIA. Você não está errada - seu Coração só precisa aprender a encontrar o ritmo natural novamente.

O que você pode fazer:
O Coração ADORA práticas que acalmam e centralizam. Com Qi Gong específico para o elemento Fogo, você pode:
• Acalmar a mente agitada e encontrar paz interior
• Dormir profundamente a noite toda
• Reduzir palpitações e ansiedade naturalmente
• Sentir alegria e clareza mental de novo

🎯 PRÓXIMO PASSO ESSENCIAL:
No evento Black November da Saúde Vitalícia, o Mestre Ye vai apresentar como VOCÊ PODE LEVAR essas práticas meditativas de Qi Gong para o seu cotidiano. Você vai conhecer o programa completo que acalma o Shen (espírito) e traz PAZ DURADOURA - não apenas um alívio temporário, mas uma transformação para toda a vida.

Seu Coração merece paz verdadeira. Descubra o caminho no evento do Mestre Ye.`
  },
  
  PULMAO: {
    nome: 'Elemento METAL (Pulmões)',
    arquetipo: 'A Organizadora',
    mensagem: (nome) => `Diagnóstico Personalizado de ${nome}

💨 DIAGNÓSTICO: Desequilíbrio no Elemento METAL (Pulmões)

O que seu corpo está dizendo:
Os problemas respiratórios, resfriados frequentes, tristeza e dificuldade de deixar ir são sinais de que seu elemento METAL está enfraquecido. Na Medicina Tradicional Chinesa, os Pulmões governam a respiração, a imunidade e também nossa capacidade de soltar o que não serve mais. Quando estão fracos, você sente peso no peito e apego ao passado.

Por que isso está acontecendo:
O elemento Metal se enfraquece quando guardamos tristeza, luto ou mágoas não processadas. Os Pulmões literalmente ficam presos nessas emoções, impedindo a renovação. É como respirar o mesmo ar viciado repetidamente - você não consegue se renovar energeticamente.

A boa notícia:
✨ Você deu o PRIMEIRO PASSO ao reconhecer que precisa SOLTAR e RENOVAR! Esta consciência é uma VITÓRIA enorme. Seu corpo está pronto para liberar o que ficou guardado e se renovar completamente.

O que você pode fazer:
Os Pulmões respondem incrivelmente às práticas respiratórias de Qi Gong. Com os exercícios certos, você pode:
• Expandir a capacidade respiratória e fortalecer imunidade
• Liberar tristeza e emoções guardadas no peito
• Aprender a soltar e seguir em frente com leveza
• Sentir renovação profunda a cada respiração

🎯 PRÓXIMO PASSO ESSENCIAL:
No evento Black November da Saúde Vitalícia, o Mestre Ye vai revelar como VOCÊ PODE INTEGRAR as práticas de Qi Gong respiratório no seu dia a dia. Você vai descobrir o programa que usa sua RESPIRAÇÃO como ferramenta de cura e renovação contínua - transformando sua saúde para o RESTO DA VIDA.

É hora de respirar fundo e abraçar sua renovação. Conheça como no evento do Mestre Ye.`
  }
};

O que seu corpo esta dizendo:
Seus sintomas de dores lombares, fraqueza nas pernas e sensacao de inseguranca nao sao coincidencia. Na Medicina Tradicional Chinesa, isso indica que seu elemento AGUA esta enfraquecido. Os Rins sao considerados a raiz da vida - eles guardam nossa essencia vital (Jing) e governam nossa forca, vitalidade e coragem.

Por que isso esta acontecendo:
O elemento Agua se enfraquece por excesso de trabalho, estresse prolongado, falta de descanso adequado e, principalmente, por nao nutrir a si mesma. Voce provavelmente passou anos cuidando dos outros e esqueceu de reabastecer sua propria fonte de energia.

A boa noticia:
Voce deu o PRIMEIRO PASSO ao identificar esse desequilibrio! Muitas pessoas vivem anos sem entender o que esta acontecendo com seu corpo. Agora voce tem um MAPA claro do que precisa ser fortalecido.

O que voce pode fazer:
Os Rins respondem MUITO bem as praticas de Qi Gong especificas para o elemento Agua. Com os movimentos certos, voce pode:
- Fortalecer a regiao lombar e eliminar as dores
- Recuperar a vitalidade e energia profunda
- Sentir-se mais segura e confiante
- Dormir melhor e acordar com disposicao

PROXIMO PASSO ESSENCIAL:
No evento Black November da Saude Vitalicia, o Mestre Ye vai revelar COMO VOCE PODE implementar essas praticas transformadoras de Qi Gong no seu dia a dia. Voce vai descobrir o caminho completo para fortalecer seu elemento Agua - com um programa estruturado que cabe na sua rotina e funciona para o RESTO DA VIDA.

Este e o momento de conhecer a solucao definitiva para sua saude vitalicia. Seu corpo esta pedindo essa transformacao.`
  },
  
  FIGADO: {
    nome: 'Elemento MADEIRA (Figado)',
    arquetipo: 'A Guerreira',
    mensagem: (nome) => `Diagnostico Personalizado de ${nome}

DIAGNOSTICO: Desequilibrio no Elemento MADEIRA (Figado)

O que seu corpo esta dizendo:
A tensao constante nos ombros, pescoco e mandibula, junto com a irritabilidade e impaciencia, sao sinais claros de que seu elemento MADEIRA esta congestionado. Na Medicina Tradicional Chinesa, o Figado governa o fluxo livre de energia (Qi) pelo corpo. Quando esse fluxo fica bloqueado, voce sente pressao, rigidez e explosoes emocionais.

Por que isso esta acontecendo:
O elemento Madeira se congestiona quando guardamos raiva, frustracao e estresse sem liberar. E como uma represa que vai acumulando pressao ate transbordar. Voce provavelmente e do tipo que aguenta firme, mas seu corpo esta mostrando que precisa SOLTAR essa energia estagnada.

A boa noticia:
Voce acabou de dar o PRIMEIRO PASSO rumo a sua libertacao! Reconhecer que ha energia bloqueada ja e meio caminho andado. Agora voce sabe que nao e fraqueza - e apenas energia precisando fluir.

O que voce pode fazer:
O Figado ADORA movimento e flexibilidade. Com as praticas corretas de Qi Gong, voce pode:
- Liberar a tensao acumulada nos ombros e pescoco
- Transformar a irritabilidade em calma interior
- Recuperar a flexibilidade fisica e emocional
- Sentir leveza e paz que voce nem lembrava que existiam

PROXIMO PASSO ESSENCIAL:
No evento Black November da Saude Vitalicia, o Mestre Ye vai apresentar a SOLUCAO COMPLETA para desbloquear seu elemento Madeira. Voce vai entender como levar essas praticas transformadoras para sua casa - com um programa que se encaixa na sua vida e libera essa tensao acumulada para SEMPRE.

Seu corpo esta pronto para fluir novamente. Descubra como no evento do Mestre Ye.`
  },
  
  BACO: {
    nome: 'Elemento TERRA (Baco)',
    arquetipo: 'A Cuidadora',
    mensagem: (nome) => `Diagnostico Personalizado de ${nome}

DIAGNOSTICO: Desequilibrio no Elemento TERRA (Baco/Pancreas)

O que seu corpo esta dizendo:
O cansaco profundo, problemas digestivos e preocupacao excessiva que voce sente sao sinais de que seu elemento TERRA esta esgotado. Na Medicina Tradicional Chinesa, o Baco e responsavel por transformar alimentos em energia (Qi) e pensamentos em clareza. Quando ele esta fraco, voce se sente exausta e mentalmente sobrecarregada.

Por que isso esta acontecendo:
O elemento Terra se enfraquece quando cuidamos demais dos outros e esquecemos de nos nutrir. Voce e aquela que sempre esta disponivel para todos, mas raramente reserva tempo para reabastecer sua propria energia. Seu Baco esta literalmente gritando por autocuidado.

A boa noticia:
Voce deu o PRIMEIRO PASSO ao reconhecer que precisa de cuidado! Esta e uma VITORIA importante - voce esta escolhendo VOCE. E a melhor parte? Com as praticas certas, voce pode recuperar sua energia sem precisar mudar toda sua rotina.

O que voce pode fazer:
O Baco responde maravilhosamente as praticas de Qi Gong que fortalecem o centro energetico (Dan Tian). Com os exercicios certos, voce pode:
- Recuperar sua energia vital e disposicao
- Melhorar digestao e absorcao de nutrientes
- Acalmar os pensamentos repetitivos
- Sentir-se nutrida e completa por dentro

PROXIMO PASSO ESSENCIAL:
No evento Black November da Saude Vitalicia, o Mestre Ye vai revelar o CAMINHO COMPLETO para fortalecer seu elemento Terra. Voce vai descobrir como essas praticas ancestrais podem se tornar parte da sua rotina diaria - transformando seu cansaco em VITALIDADE que dura a vida toda.

Voce merece se sentir cheia de energia todos os dias. Conheca a solucao no evento do Mestre Ye.`
  },
  
  CORACAO: {
    nome: 'Elemento FOGO (Coracao)',
    arquetipo: 'A Comunicadora',
    mensagem: (nome) => `Diagnostico Personalizado de ${nome}

DIAGNOSTICO: Desequilibrio no Elemento FOGO (Coracao)

O que seu corpo esta dizendo:
A insonia, ansiedade, palpitacoes e agitacao mental constante sao sinais de que seu elemento FOGO esta desequilibrado. Na Medicina Tradicional Chinesa, o Coracao abriga o Shen (espirito/consciencia). Quando o Fogo esta desregulado, e como se a chama interna estivesse descontrolada - muito agitada, impossivel de acalmar.

Por que isso esta acontecendo:
O elemento Fogo se desregula por excesso de estimulos mentais, preocupacoes constantes e falta de momentos de paz verdadeira. Seu Coracao esta hiperativo, processando mil pensamentos ao mesmo tempo, sem conseguir descansar. E como deixar todas as luzes da casa acesas 24h - eventualmente, o sistema sobrecarrega.

A boa noticia:
Voce deu o PRIMEIRO PASSO ao buscar entender o que esta acontecendo! Reconhecer que sua mente precisa de paz ja e uma GRANDE VITORIA. Voce nao esta errada - seu Coracao so precisa aprender a encontrar o ritmo natural novamente.

O que voce pode fazer:
O Coracao ADORA praticas que acalmam e centralizam. Com Qi Gong especifico para o elemento Fogo, voce pode:
- Acalmar a mente agitada e encontrar paz interior
- Dormir profundamente a noite toda
- Reduzir palpitacoes e ansiedade naturalmente
- Sentir alegria e clareza mental de novo

PROXIMO PASSO ESSENCIAL:
No evento Black November da Saude Vitalicia, o Mestre Ye vai apresentar como VOCE PODE LEVAR essas praticas meditativas de Qi Gong para o seu cotidiano. Voce vai conhecer o programa completo que acalma o Shen (espirito) e traz PAZ DURADOURA - nao apenas um alivio temporario, mas uma transformacao para toda a vida.

Seu Coracao merece paz verdadeira. Descubra o caminho no evento do Mestre Ye.`
  },
  
  PULMAO: {
    nome: 'Elemento METAL (Pulmoes)',
    arquetipo: 'A Organizadora',
    mensagem: (nome) => `Diagnostico Personalizado de ${nome}

DIAGNOSTICO: Desequilibrio no Elemento METAL (Pulmoes)

O que seu corpo esta dizendo:
Os problemas respiratorios, resfriados frequentes, tristeza e dificuldade de deixar ir sao sinais de que seu elemento METAL esta enfraquecido. Na Medicina Tradicional Chinesa, os Pulmoes governam a respiracao, a imunidade e tambem nossa capacidade de soltar o que nao serve mais. Quando estao fracos, voce sente peso no peito e apego ao passado.

Por que isso esta acontecendo:
O elemento Metal se enfraquece quando guardamos tristeza, luto ou magoas nao processadas. Os Pulmoes literalmente ficam presos nessas emocoes, impedindo a renovacao. E como respirar o mesmo ar viciado repetidamente - voce nao consegue se renovar energeticamente.

A boa noticia:
Voce deu o PRIMEIRO PASSO ao reconhecer que precisa SOLTAR e RENOVAR! Esta consciencia e uma VITORIA enorme. Seu corpo esta pronto para liberar o que ficou guardado e se renovar completamente.

O que voce pode fazer:
Os Pulmoes respondem incrivelmente as praticas respiratorias de Qi Gong. Com os exercicios certos, voce pode:
- Expandir a capacidade respiratoria e fortalecer imunidade
- Liberar tristeza e emocoes guardadas no peito
- Aprender a soltar e seguir em frente com leveza
- Sentir renovacao profunda a cada respiracao

PROXIMO PASSO ESSENCIAL:
No evento Black November da Saude Vitalicia, o Mestre Ye vai revelar como VOCE PODE INTEGRAR as praticas de Qi Gong respiratorio no seu dia a dia. Voce vai descobrir o programa que usa sua RESPIRACAO como ferramenta de cura e renovacao continua - transformando sua saude para o RESTO DA VIDA.

E hora de respirar fundo e abracar sua renovacao. Conheca como no evento do Mestre Ye.`
  }
};

function contarElementos(respostas) {
  const contagem = { RIM: 0, FIGADO: 0, BACO: 0, CORACAO: 0, PULMAO: 0 };
  
  if (respostas.P2 && Array.isArray(respostas.P2)) {
    respostas.P2.forEach(opcao => {
      const elemento = MAPEAMENTO_ELEMENTOS.P2[opcao];
      if (elemento && elemento !== 'NEUTRO') {
        contagem[elemento] += 3;
        console.log(`    P2[${opcao}] -> ${elemento} (+3)`);
      }
    });
  }
  
  if (respostas.P4 && Array.isArray(respostas.P4)) {
    respostas.P4.forEach(opcao => {
      const elemento = MAPEAMENTO_ELEMENTOS.P4[opcao];
      if (elemento && elemento !== 'NEUTRO') {
        contagem[elemento] += 2;
        console.log(`    P4[${opcao}] -> ${elemento} (+2)`);
      }
    });
  }
  
  if (respostas.P5) {
    const elemento = MAPEAMENTO_ELEMENTOS.P5[respostas.P5];
    if (elemento && elemento !== 'NEUTRO') {
      contagem[elemento] += 1;
      console.log(`    P5[${respostas.P5}] -> ${elemento} (+1)`);
    }
  }
  
  console.log('  Contagem:', contagem);
  return contagem;
}

function determinarElementoPrincipal(contagem) {
  let maxValor = 0;
  let elementoEscolhido = 'BACO';
  
  for (const [elemento, valor] of Object.entries(contagem)) {
    if (valor > maxValor) {
      maxValor = valor;
      elementoEscolhido = elemento;
    }
  }
  
  console.log(`  Elemento principal: ${elementoEscolhido} (${maxValor} pontos)`);
  return elementoEscolhido;
}

function calcularIntensidade(respostas) {
  const pesos = { 'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1 };
  return pesos[respostas.P1] || 3;
}

function calcularUrgencia(respostas) {
  const pesos = { 'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1 };
  return pesos[respostas.P8] || 3;
}

function determinarQuadrante(intensidade, urgencia) {
  if (intensidade >= 4 && urgencia >= 4) return 1;
  if (intensidade >= 4 && urgencia <= 3) return 2;
  if (intensidade <= 3 && urgencia >= 4) return 3;
  return 4;
}

function calcularLeadScore(respostas) {
  let score = 0;
  
  const pesoP1 = { 'A': 20, 'B': 16, 'C': 12, 'D': 8, 'E': 4 };
  score += pesoP1[respostas.P1] || 0;
  
  const pesoP3 = { 'A': 15, 'B': 12, 'C': 9, 'D': 6, 'E': 3 };
  score += pesoP3[respostas.P3] || 0;
  
  const pesoP6 = { 'A': 15, 'B': 12, 'C': 9, 'D': 6, 'E': 3 };
  score += pesoP6[respostas.P6] || 0;
  
  const pesoP8 = { 'A': 20, 'B': 16, 'C': 12, 'D': 8, 'E': 4 };
  score += pesoP8[respostas.P8] || 0;
  
  const pesoP9 = { 'A': 15, 'B': 12, 'C': 9, 'D': 6, 'E': 3 };
  score += pesoP9[respostas.P9] || 0;
  
  const pesoP11 = { 'A': 2, 'B': 3, 'C': 4, 'D': 5, 'E': 6, 'F': 7, 'G': 8, 'H': 9, 'I': 10, 'J': 10 };
  score += pesoP11[respostas.P11] || 0;
  
  if (respostas.P12 === 'A') score += 5;
  
  return Math.min(score, 100);
}

function calcularDiagnostico(respostas, nomeCompleto) {
  console.log('\nCALCULANDO DIAGNOSTICO MTC...');
  
  const contagem = contarElementos(respostas);
  const elementoPrincipal = determinarElementoPrincipal(contagem);
  const intensidade = calcularIntensidade(respostas);
  const urgencia = calcularUrgencia(respostas);
  const quadrante = determinarQuadrante(intensidade, urgencia);
  const leadScore = calcularLeadScore(respostas);
  const prioridade = leadScore >= 70 ? 'ALTA' : leadScore >= 40 ? 'MEDIA' : 'BAIXA';
  const isHotLeadVIP = leadScore >= 80 || quadrante === 1 || respostas.P8 === 'A';
  
  const info = DIAGNOSTICOS[elementoPrincipal] || DIAGNOSTICOS['BACO'];
  const primeiroNome = nomeCompleto.split(' ')[0];
  
  const resultado = {
    elemento_principal: elementoPrincipal,
    codigo_perfil: `${elementoPrincipal.substring(0, 2)}-${intensidade}`,
    nome_perfil: info.nome,
    arquetipo: info.arquetipo,
    quadrante: quadrante,
    diagnostico_resumo: info.mensagem(primeiroNome),
    lead_score: leadScore,
    prioridade: prioridade,
    is_hot_lead_vip: isHotLeadVIP
  };
  
  console.log('Diagnostico:', resultado.codigo_perfil, '-', resultado.nome_perfil);
  console.log('Score:', resultado.lead_score, '| Quadrante:', resultado.quadrante);
  
  return resultado;
}

function gerarScriptAbertura(elemento, nome) {
  const scripts = {
    RIM: `Ola ${nome}!\n\nVi que voce esta sentindo dores lombares e fraqueza. Isso e muito comum quando o elemento AGUA (Rins) esta enfraquecido na Medicina Tradicional Chinesa.\n\nA boa noticia e que o Mestre Ye tem ajudado centenas de mulheres a recuperarem sua vitalidade atraves de tecnicas milenares de Qi Gong!\n\nQuando os Rins estao fortes, voce sente energia, confianca e seguranca.\n\n*Essas dores nas costas tem te impedido de fazer atividades que voce gostava?*`,
    
    FIGADO: `Oi ${nome}!\n\nNotei que voce mencionou tensao nos ombros e irritabilidade. Esses sao sinais classicos de que o elemento MADEIRA (Figado) precisa de atencao.\n\nO Mestre Ye especializa-se em desbloquear essa energia estagnada atraves do Qi Gong!\n\nQuando o Figado esta equilibrado, voce sente leveza, flexibilidade e paz interior.\n\n*Voce sente que essa tensao e irritabilidade tem afetado seus relacionamentos ou seu dia a dia?*`,
    
    BACO: `Ola ${nome}!\n\nVi que voce esta com cansaco profundo e preocupacoes. Isso indica que o elemento TERRA (Baco) esta precisando de cuidado.\n\nO Mestre Ye tem tecnicas especificas de Qi Gong para fortalecer seu centro energetico!\n\nQuando o Baco esta forte, voce sente energia, clareza mental e capacidade de cuidar de si mesma.\n\n*Esse cansaco constante tem te impedido de aproveitar seus dias com qualidade?*`,
    
    CORACAO: `Oi ${nome}!\n\nNotei que voce mencionou insonia e ansiedade. Esses sao sinais de que o elemento FOGO (Coracao) esta desequilibrado.\n\nO Mestre Ye ensina tecnicas de Qi Gong para acalmar o Shen (espirito) e trazer paz interior!\n\nQuando o Coracao esta equilibrado, voce dorme profundamente e sente alegria.\n\n*A insonia e ansiedade tem prejudicado sua qualidade de vida e suas relacoes?*`,
    
    PULMAO: `Ola ${nome}!\n\nVi que voce tem problemas respiratorios e tristeza. Isso mostra que o elemento METAL (Pulmoes) precisa ser fortalecido.\n\nO Mestre Ye tem praticas especiais de Qi Gong respiratorio!\n\nQuando os Pulmoes estao fortes, voce respira profundamente e se renova.\n\n*Voce sente que essa tristeza e dificuldade de soltar tem te impedido de seguir em frente?*`
  };
  
  return scripts[elemento] || scripts['BACO'];
}

function gerarScriptOferta(quadrante, leadScore, respostas) {
  const renda = respostas.P11;
  
  if (quadrante === 1 && leadScore >= 80 && ['F', 'G', 'H', 'I', 'J'].includes(renda)) {
    return JSON.stringify({
      oferta: 'Programa VIP Personalizado (12 meses)',
      valor: 'R$ 12.000 - R$ 18.000',
      beneficios: [
        'Acompanhamento individualizado com Mestre Ye',
        'Sessoes semanais de Qi Gong personalizado',
        'Acupuntura + Fitoterapia Chinesa',
        'Grupo VIP exclusivo no WhatsApp',
        'Retiros trimestrais presenciais'
      ],
      abordagem: 'Apresentar como investimento em saude vitalicia. Enfatizar exclusividade.'
    });
  }
  
  if (leadScore >= 60 && ['D', 'E', 'F', 'G'].includes(renda)) {
    return JSON.stringify({
      oferta: 'Programa Semestral de Transformacao (6 meses)',
      valor: 'R$ 4.200 - R$ 7.200',
      beneficios: [
        'Aulas em grupo 2x por semana',
        'Protocolo personalizado de Qi Gong',
        'Consultoria inicial com Mestre Ye',
        'Material didatico completo'
      ],
      abordagem: 'Focar nos resultados em medio prazo. Mostrar casos de sucesso.'
    });
  }
  
  return JSON.stringify({
    oferta: 'Workshop Intensivo Black November (3 dias)',
    valor: 'R$ 497 - R$ 997',
    beneficios: [
      '3 dias de imersao com Mestre Ye',
      'Aprenda 5 exercicios essenciais de Qi Gong',
      'Diagnostico personalizado',
      'Material de apoio digital'
    ],
    abordagem: 'Convite especial para o evento. Criar senso de urgencia.'
  });
}

// ========================================
// ROTAS
// ========================================

app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'API do Quiz esta funcionando! Use POST /api/quiz/submit' 
  });
});

app.post('/api/quiz/submit', async (req, res) => {
  try {
    console.log('\nRecebendo dados do quiz...');
    
    const { lead, respostas } = req.body;

    if (!lead || !respostas) {
      console.log('Dados incompletos');
      return res.status(400).json({ 
        success: false, 
        message: 'Dados incompletos' 
      });
    }

    console.log('Lead:', lead.NOME, '-', lead.CELULAR);

    const diagnostico = calcularDiagnostico(respostas, lead.NOME);
    
    const primeiroNome = lead.NOME.split(' ')[0];
    const scriptAbertura = gerarScriptAbertura(diagnostico.elemento_principal, primeiroNome);
    const scriptOferta = gerarScriptOferta(diagnostico.quadrante, diagnostico.lead_score, respostas);

    console.log('\nSalvando no Supabase...');
    
    const { data: leadExistente } = await supabase
      .from('quiz_leads')
      .select('id')
      .eq('celular', lead.CELULAR)
      .maybeSingle();

    let resultado;

    if (leadExistente) {
      console.log('Atualizando lead existente...');
      const { data, error } = await supabase
        .from('quiz_leads')
        .update({
          nome: lead.NOME,
          email: lead.EMAIL,
          respostas: respostas,
          elemento_principal: diagnostico.elemento_principal,
          codigo_perfil: diagnostico.codigo_perfil,
          nome_perfil: diagnostico.nome_perfil,
          arquetipo: diagnostico.arquetipo,
          quadrante: diagnostico.quadrante,
          diagnostico_resumo: diagnostico.diagnostico_resumo,
          lead_score: diagnostico.lead_score,
          prioridade: diagnostico.prioridade,
          is_hot_lead_vip: diagnostico.is_hot_lead_vip,
          script_abertura: scriptAbertura,
          script_oferta_recomendada: scriptOferta,
          updated_at: new Date().toISOString()
        })
        .eq('celular', lead.CELULAR)
        .select();

      if (error) throw error;
      resultado = data;
      
    } else {
      console.log('Inserindo novo lead...');
      const { data, error } = await supabase
        .from('quiz_leads')
        .insert({
          nome: lead.NOME,
          email: lead.EMAIL,
          celular: lead.CELULAR,
          respostas: respostas,
          elemento_principal: diagnostico.elemento_principal,
          codigo_perfil: diagnostico.codigo_perfil,
          nome_perfil: diagnostico.nome_perfil,
          arquetipo: diagnostico.arquetipo,
          quadrante: diagnostico.quadrante,
          diagnostico_resumo: diagnostico.diagnostico_resumo,
          lead_score: diagnostico.lead_score,
          prioridade: diagnostico.prioridade,
          is_hot_lead_vip: diagnostico.is_hot_lead_vip,
          script_abertura: scriptAbertura,
          script_oferta_recomendada: scriptOferta,
          whatsapp_status: 'AGUARDANDO_CONTATO',
          created_at: new Date().toISOString()
        })
        .select();

      if (error) throw error;
      resultado = data;
    }

    if (diagnostico.is_hot_lead_vip) {
      console.log('HOT LEAD VIP DETECTADO! Score:', diagnostico.lead_score);
    }

    console.log('Dados salvos com sucesso!\n');
    
    return res.status(200).json({ 
      success: true, 
      message: 'Lead salvo com sucesso!',
      lead_id: resultado[0].id,
      diagnostico: {
        elemento: diagnostico.elemento_principal,
        perfil: diagnostico.nome_perfil,
        codigo: diagnostico.codigo_perfil,
        lead_score: diagnostico.lead_score,
        quadrante: diagnostico.quadrante,
        is_vip: diagnostico.is_hot_lead_vip
      }
    });
    
  } catch (error) {
    console.error('Erro:', error.message);
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`
  API rodando em http://localhost:${PORT}
  Endpoints disponiveis:
     - GET  / (teste)
     - POST /api/quiz/submit (salvar quiz)
  `);
});