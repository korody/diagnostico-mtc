PROBLEMA DE NORMALIZAÇÃO
=======================

Resumo do caso (registrado em fluxo de observação):

- Nome curto: PROBLEMA DE NORMALIZAÇÃO
- Data registrada: 2025-10-29

Descrição
---------
Usuária/leads informou um número no formulário e o sistema normalizou/transformou de forma inconsistente, causando mismatch com o contato que chegou via Unnichat e, como consequência, envio falhou ("Window is Closed" do Unnichat) porque não houve match com o contato correto.

Exemplo real reportado:
- Telefone inserido no formulário pelo lead: 55991679976
- Telefone que o nosso sistema tentou enviar (após normalização/format): 5555991679976
- Telefone com o qual o lead entrou em contato no Unnichat: 555191679976

Exemplo adicional reportado:
- Telefone inserido no formulário pelo lead: 71987643968
- Telefone que o nosso sistema tentou enviar (após normalização/format): 5571987643968
- Telefone com o qual o lead entrou em contato no Unnichat: 557187643967

Observações importantes
----------------------
- Há discrepância por: DDI (55), DDD, e o dígito "9" extra em celulares brasileiros (comportamento regional). O lead digitou dois 9s e o número recebido no Unnichat apareceu com apenas um 9.
- O evento original aparentemente não gerou logs completos que permitissem a correlação imediata (por isso a investigação foi necessária).

Ações já tomadas
-----------------
- Adicionei logs detalhados em `api/webhook/unnichat/ver-resultados.js` para capturar: rawPhone, normalized, candidates gerados (last10/9/8, with/without 55, heuristic remove double-9) e `phoneForUnnichat` antes do envio. Commit: chore(logging): add detailed phone candidates + phoneForUnnichat logs in ver-resultados (commit f9ab66a7).
- Corrigi bug de ReferenceError `contactResp is not defined` em `api/webhook/unnichat/ver-resultados.js` (commit fdecc1a1).
- Atualizei os markers de log para facilitar busca rápida no Vercel (✅ DIAGNÓSTICO RECEBIDO, 📃 DIAGNÓSTICO ENVIADO, 🎈DESAFIO ENVIADO).

Recomendações (não aplicadas ainda)
----------------------------------
- Não mudar normalização imediatamente sem validação:
  1. Melhorar observabilidade (feito) e monitorar novos logs para coletar mais exemplos reais.
  2. Implementar geração segura de `candidates` e tentar localizar contato no Unnichat antes de enviar (com política de fallback/manual quando a correspondência for parcial).
  3. Considerar uso de uma biblioteca robusta (libphonenumber) para canonicalização E.164 em backfill e entrada futura.

Como reproduzir / audit
-----------------------
- Aguardar próximo evento e localizar logs no Vercel para a rota `/api/webhook/unnichat/ver-resultados`.
- Filtrar por Request ID e procurar os marcadores: '🔎 Candidates de telefone para debug' e '📲 phoneForUnnichat'.
- Rodar consultas SQL no Supabase para procurar registros que contenham os fragmentos do número recebido no Unnichat (ex.: últimos 6/8/9/10 dígitos). Exemplos de SQL abaixo.

SQL de auditoria (exemplos)
---------------------------
-- Buscar por últimos 6 dígitos
SELECT id, nome, celular, email
FROM quiz_leads
WHERE celular LIKE '%1679976%'
LIMIT 50;

-- Buscar por últimos 8/9/10 dígitos (rodar separadamente para cada fragmento)
SELECT id, nome, celular, email
FROM quiz_leads
WHERE celular LIKE '%91679976%' OR celular LIKE '%991679976%'
LIMIT 100;

Notas finais
-----------
- Chamarei este documento de referência quando você mencionar "PROBLEMA DE NORMALIZAÇÃO".
- Quando quiser retomar: diga "RETOMAR: PROBLEMA DE NORMALIZAÇÃO" e eu procedo com os próximos passos (A/B/C/D) previamente discutidos.


