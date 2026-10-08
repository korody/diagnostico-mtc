-- Adicionar coluna 'indice_harmonia' na tabela quiz_leads
--
-- Mede o equilíbrio energético do lead numa escala 0-100:
--   100 = harmonia perfeita | 0 = desequilíbrio máximo
--
-- Fórmula (lib/calculos.js -> calcularIndiceHarmonia):
--   harmonia = 100
--     - (concentração do elemento dominante / total) * 40
--     - (intensidade / 5) * 30
--     - (urgência / 5) * 30
--
-- NOTA: a coluna já foi criada manualmente no Supabase antes desta migration.
-- Este arquivo existe para que o schema fique versionado no repo e para
-- reproduzir o ambiente do zero. É idempotente.

ALTER TABLE quiz_leads
ADD COLUMN IF NOT EXISTS indice_harmonia INTEGER;

COMMENT ON COLUMN quiz_leads.indice_harmonia IS
  'Índice de harmonia energética 0-100 (maior = mais equilibrado). Calculado em lib/calculos.js.';

-- Índice para filtrar/ordenar leads por desequilíbrio no painel
CREATE INDEX IF NOT EXISTS idx_quiz_leads_indice_harmonia
  ON quiz_leads(indice_harmonia);

-- Backfill dos leads anteriores: rodar scripts/migrate-indice-harmonia.js
-- (recalcula a partir de contagem_elementos, intensidade_calculada e
--  urgencia_calculada já salvos; processa 500 leads por execução)
