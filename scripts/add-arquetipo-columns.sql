-- ========================================
-- ADICIONAR COLUNAS DE ARQUÉTIPOS COMPORTAMENTAIS
-- Execute este SQL no Supabase SQL Editor
-- ========================================

-- 1. Adicionar colunas dos novos campos de arquétipos
ALTER TABLE quiz_leads ADD COLUMN IF NOT EXISTS perfil_comercial TEXT;
ALTER TABLE quiz_leads ADD COLUMN IF NOT EXISTS scores_arquetipos JSONB;
ALTER TABLE quiz_leads ADD COLUMN IF NOT EXISTS confianca_arquetipo NUMERIC(5,2);
ALTER TABLE quiz_leads ADD COLUMN IF NOT EXISTS objecao_principal TEXT;
ALTER TABLE quiz_leads ADD COLUMN IF NOT EXISTS autonomia_decisao TEXT;
ALTER TABLE quiz_leads ADD COLUMN IF NOT EXISTS investimento_mensal_atual NUMERIC(10,2);

-- 2. Criar índices para melhorar performance de queries
CREATE INDEX IF NOT EXISTS idx_quiz_leads_perfil_comercial ON quiz_leads(perfil_comercial);
CREATE INDEX IF NOT EXISTS idx_quiz_leads_autonomia ON quiz_leads(autonomia_decisao);
CREATE INDEX IF NOT EXISTS idx_quiz_leads_objecao ON quiz_leads(objecao_principal);

-- 3. Adicionar comentários descritivos
COMMENT ON COLUMN quiz_leads.perfil_comercial IS 'Perfil comportamental/comercial: SILENT_WARRIOR, SKEPTICAL_SCIENTIST, ETERNAL_MOTHER, RISING_PHOENIX';
COMMENT ON COLUMN quiz_leads.scores_arquetipos IS 'Scores de todos os 4 arquétipos (JSON: {SILENT_WARRIOR: 0.75, ...})';
COMMENT ON COLUMN quiz_leads.confianca_arquetipo IS 'Confiança do arquétipo principal (0-1)';
COMMENT ON COLUMN quiz_leads.objecao_principal IS 'Principal objeção identificada: MEDO_FALHAR, FALTA_TEMPO, MEDO_DEPENDENCIA, BUSCA_TRANSFORMACAO, SEM_OBJECAO';
COMMENT ON COLUMN quiz_leads.autonomia_decisao IS 'Nível de autonomia: TOTAL, ALTA, MEDIA, BAIXA';
COMMENT ON COLUMN quiz_leads.investimento_mensal_atual IS 'Investimento mensal atual em saúde (calculado a partir de P20)';

-- 4. Verificar estrutura final
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'quiz_leads'
  AND column_name IN (
    'perfil_comercial',
    'scores_arquetipos',
    'confianca_arquetipo',
    'objecao_principal',
    'autonomia_decisao',
    'investimento_mensal_atual'
  )
ORDER BY column_name;

-- ========================================
-- NOTAS IMPORTANTES:
-- ========================================
-- 
-- ✅ O campo 'respostas' (JSONB) JÁ SUPORTA as novas perguntas P14-P20
--    - JSON é flexível, não precisa alteração
--
-- ✅ Estas novas colunas são OPCIONAIS (permitem NULL)
--    - Leads antigos não terão esses dados
--    - Novos leads (após deploy) terão os dados preenchidos
--
-- ✅ Compatibilidade retroativa mantida
--    - API continua funcionando com leads antigos
--    - Frontend só renderiza arquétipos se os dados existirem
--
-- ========================================
