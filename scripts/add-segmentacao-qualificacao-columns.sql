-- ========================================
-- ADICIONAR COLUNAS DE SEGMENTAÇÃO E QUALIFICAÇÃO
-- Execute este SQL no Supabase SQL Editor
-- ========================================

-- 1. Adicionar coluna de localização geográfica (P17)
ALTER TABLE quiz_leads ADD COLUMN IF NOT EXISTS estado TEXT;

-- 2. Adicionar coluna de custo mensal do problema (P21)
ALTER TABLE quiz_leads ADD COLUMN IF NOT EXISTS custo_mensal_problema NUMERIC(10,2);

-- 3. Criar índices para melhorar performance de queries
CREATE INDEX IF NOT EXISTS idx_quiz_leads_estado ON quiz_leads(estado);
CREATE INDEX IF NOT EXISTS idx_quiz_leads_custo_mensal ON quiz_leads(custo_mensal_problema);

-- 4. Adicionar comentários descritivos
COMMENT ON COLUMN quiz_leads.estado IS 'Localização geográfica (sigla do estado ou OUTRO para internacional)';
COMMENT ON COLUMN quiz_leads.custo_mensal_problema IS 'Quanto o lead gasta por mês para lidar com o problema de saúde (R$)';

-- 5. Verificar estrutura final
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'quiz_leads'
  AND column_name IN (
    'estado',
    'custo_mensal_problema'
  )
ORDER BY column_name;

-- ========================================
-- NOTAS IMPORTANTES:
-- ========================================
-- 
-- ✅ O campo 'respostas' (JSONB) JÁ SUPORTA P17 e P21
--    - JSON é flexível, não precisa alteração
-- 
-- ✅ Ambas colunas permitem NULL
--    - Compatível com leads antigos (antes das novas perguntas)
-- 
-- ✅ Índices criados para queries de segmentação
--    - Ex: "Leads de SP com custo > R$ 500"
-- 
-- ========================================
-- QUERIES DE EXEMPLO APÓS MIGRAÇÃO:
-- ========================================

-- Leads por região com alto custo do problema
-- SELECT estado, COUNT(*) as total, AVG(custo_mensal_problema) as custo_medio
-- FROM quiz_leads
-- WHERE custo_mensal_problema > 500
-- GROUP BY estado
-- ORDER BY total DESC;

-- Top 10 leads que mais gastam mensalmente
-- SELECT nome, email, estado, custo_mensal_problema, lead_score
-- FROM quiz_leads
-- WHERE custo_mensal_problema IS NOT NULL
-- ORDER BY custo_mensal_problema DESC
-- LIMIT 10;

-- Distribuição geográfica dos leads
-- SELECT estado, COUNT(*) as total
-- FROM quiz_leads
-- GROUP BY estado
-- ORDER BY total DESC;
