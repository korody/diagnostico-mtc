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

Eu vi seu diagnóstico e, com a sua experiência como meu aluno, notei sinais de desequilíbrio em ${elementoFalado}.

Provavelmente você tem sentido ${sintomas} — e sei que, quando retomamos a prática certa, isso muda rápido.

Minha sugestão é dar um passo de retorno: movimentos simples, respiração guiada e um ajuste de foco para ${solucao}.

Preparei um caminho especial para ex-alunos retomarem com consistência, sem pressão, só o que realmente funciona para o seu caso.

Se fizer sentido, te envio agora o link com as orientações e a condição exclusiva para quem já é da casa.

Você topa dar esse primeiro passo comigo hoje?`;
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
