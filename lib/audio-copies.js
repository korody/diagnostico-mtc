// lib/audio-copies.js
// Centraliza as cópias de áudio para diferentes perfis (não-alunos vs alunos)

function baseDoLead(lead) {
  const primeiroNome = (lead?.nome || 'Amigo').split(' ')[0];
  const elemento = lead?.elemento_principal || 'CORAÇÃO';

  const sintomasPorElemento = {
    'RIM': 'dores nas costas, cansaço extremo e sensação de frio',
    'FÍGADO': 'tensão muscular, irritabilidade e rigidez no corpo',
    'BAÇO': 'digestão difícil, inchaço e peso nas pernas',
    'CORAÇÃO': 'insônia, ansiedade e palpitações',
    'PULMÃO': 'respiração curta, resfriados frequentes e cansaço'
  };

  const solucoesPorElemento = {
    'RIM': 'fortalecer sua energia vital e recuperar a vitalidade que você perdeu',
    'FÍGADO': 'liberar toda essa tensão acumulada e voltar a ter leveza no corpo',
    'BAÇO': 'reequilibrar sua digestão e ter mais disposição no dia a dia',
    'CORAÇÃO': 'acalmar sua mente, dormir bem e recuperar sua paz interior',
    'PULMÃO': 'fortalecer sua respiração e aumentar sua imunidade'
  };

  const elementoPronuncia = {
    'RIM': 'rim',
    'FÍGADO': 'fígado',
    'BAÇO': 'baço',
    'CORAÇÃO': 'coração',
    'PULMÃO': 'pulmão'
  };

  const sintomas = sintomasPorElemento[elemento] || 'desconfortos e dores';
  const solucao = solucoesPorElemento[elemento] || 'reequilibrar sua energia';
  const elementoFalado = elementoPronuncia[elemento] || String(elemento).toLowerCase();

  return { primeiroNome, elemento, elementoFalado, sintomas, solucao };
}

function copyNaoAlunos(lead) {
  const { primeiroNome, elementoFalado, sintomas, solucao } = baseDoLead(lead);

  return `Oi ${primeiroNome}, aqui é o Mestre Ye.

Eu analisei seu diagnóstico e percebi a deficiência de ${elementoFalado}.

Sei exatamente o que você está passando com ${sintomas}.

Não deve ser fácil conviver com isso todos os dias.

Mas a boa notícia é que eu sei como ${solucao}.

E é exatamente isso que você vai alcançar ao garantir o SUPER COMBO Vitalício hoje.

Essa oferta é histórica! Eu nunca fiz nada igual.

${primeiroNome}, essa é a última turma. É a sua chance. Não espera seus sintomas piorarem pra você se arrepender.

Clica no link que eu vou te mandar agora para garantir a sua vaga antes que seja tarde.

A minha equipe tá querendo fechar as inscrições em breve, porque estamos chegando no nosso limite de alunos.

Posso contar com você na nossa turma?`;
}

function copyAlunos(lead) {
  const { primeiroNome, elementoFalado, sintomas, solucao } = baseDoLead(lead);

  return `Oi ${primeiroNome}, aqui é o Mestre Ye.

Como você já confiou no meu trabalho no passado, decidi dedicar um tempo para analisar seu diagnóstico hoje e notei alguns sinais de desequilíbrio em ${elementoFalado}.

Com isso, provavelmente você sente ${sintomas}.

Mas, se você pratica regularmente meus exercícios, já deve ter sentido ${solucao}.

${primeiroNome} você sabe que meu método funciona.

E eu preparei uma condição realmente imperdível para alunos e ex-alunos aproveitarem o SUPER COMBO VITALÍCIO.

É a mesma transformação que você já conhece, só que agora com acesso PERMANENTE a tudo que você precisa para manter os resultados para sempre.

Mas preciso te avisar: essa é a última turma com esse pacote tão completo e vitalício.

Depois disso, não vai ter mais essa condição.

Se faz sentido pra você garantir esse acesso agora, clica no link que vou te mandar.

A minha equipe tá fechando as vagas em breve porque já estamos no limite.

Posso contar com você nessa turma, ${primeiroNome}?`;
}

function gerarScriptParaLead(lead) {
  if (lead?.is_aluno) return copyAlunos(lead);
  return copyNaoAlunos(lead);
}

module.exports = {
  gerarScriptParaLead,
  copyNaoAlunos,
  copyAlunos,
};
