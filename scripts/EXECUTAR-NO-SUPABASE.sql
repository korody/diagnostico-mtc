-- ========================================
-- EXECUTE ESTE SQL NO SUPABASE SQL EDITOR
-- ========================================

-- Adicionar colunas faltantes
ALTER TABLE quiz_leads ADD COLUMN IF NOT EXISTS contagem_elementos JSONB;
ALTER TABLE quiz_leads ADD COLUMN IF NOT EXISTS intensidade_calculada INTEGER;
ALTER TABLE quiz_leads ADD COLUMN IF NOT EXISTS urgencia_calculada INTEGER;
ALTER TABLE quiz_leads ADD COLUMN IF NOT EXISTS elemento_principal TEXT;
ALTER TABLE quiz_leads ADD COLUMN IF NOT EXISTS quadrante INTEGER;
ALTER TABLE quiz_leads ADD COLUMN IF NOT EXISTS lead_score INTEGER;
ALTER TABLE quiz_leads ADD COLUMN IF NOT EXISTS prioridade TEXT;
ALTER TABLE quiz_leads ADD COLUMN IF NOT EXISTS is_hot_lead_vip BOOLEAN DEFAULT FALSE;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_quiz_leads_elemento ON quiz_leads(elemento_principal);
CREATE INDEX IF NOT EXISTS idx_quiz_leads_score ON quiz_leads(lead_score DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_leads_quadrante ON quiz_leads(quadrante);
CREATE INDEX IF NOT EXISTS idx_quiz_leads_vip ON quiz_leads(is_hot_lead_vip) WHERE is_hot_lead_vip = true;
