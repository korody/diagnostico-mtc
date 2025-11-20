-- ========================================
-- SCRIPT SQL: Adicionar colunas faltantes na tabela quiz_leads
-- ========================================
-- Execute este script no Supabase SQL Editor se as colunas não existirem
-- ========================================

-- Adicionar coluna contagem_elementos (JSONB)
ALTER TABLE quiz_leads 
ADD COLUMN IF NOT EXISTS contagem_elementos JSONB;

-- Adicionar coluna intensidade_calculada (INTEGER)
ALTER TABLE quiz_leads 
ADD COLUMN IF NOT EXISTS intensidade_calculada INTEGER;

-- Adicionar coluna urgencia_calculada (INTEGER)
ALTER TABLE quiz_leads 
ADD COLUMN IF NOT EXISTS urgencia_calculada INTEGER;

-- Verificar se as outras colunas já existem (caso contrário, criar)
ALTER TABLE quiz_leads 
ADD COLUMN IF NOT EXISTS elemento_principal TEXT;

ALTER TABLE quiz_leads 
ADD COLUMN IF NOT EXISTS quadrante INTEGER;

ALTER TABLE quiz_leads 
ADD COLUMN IF NOT EXISTS lead_score INTEGER;

ALTER TABLE quiz_leads 
ADD COLUMN IF NOT EXISTS prioridade TEXT;

ALTER TABLE quiz_leads 
ADD COLUMN IF NOT EXISTS is_hot_lead_vip BOOLEAN DEFAULT FALSE;

-- Adicionar índices para melhorar performance de queries
CREATE INDEX IF NOT EXISTS idx_quiz_leads_elemento ON quiz_leads(elemento_principal);
CREATE INDEX IF NOT EXISTS idx_quiz_leads_score ON quiz_leads(lead_score DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_leads_quadrante ON quiz_leads(quadrante);
CREATE INDEX IF NOT EXISTS idx_quiz_leads_vip ON quiz_leads(is_hot_lead_vip) WHERE is_hot_lead_vip = true;

-- Comentários nas colunas para documentação
COMMENT ON COLUMN quiz_leads.contagem_elementos IS 'Contagem de pontos por elemento MTC (RIM, FÍGADO, BAÇO, CORAÇÃO, PULMÃO)';
COMMENT ON COLUMN quiz_leads.intensidade_calculada IS 'Intensidade das dores (1-5) calculada a partir de P1';
COMMENT ON COLUMN quiz_leads.urgencia_calculada IS 'Urgência para resolver (1-5) calculada a partir de P8';
COMMENT ON COLUMN quiz_leads.elemento_principal IS 'Elemento dominante segundo MTC (RIM, FÍGADO, BAÇO, CORAÇÃO, PULMÃO)';
COMMENT ON COLUMN quiz_leads.quadrante IS 'Quadrante do lead (1=Hot, 2=Alta intensidade, 3=Alta urgência, 4=Baixa prioridade)';
COMMENT ON COLUMN quiz_leads.lead_score IS 'Score de qualificação do lead (0-100)';
COMMENT ON COLUMN quiz_leads.prioridade IS 'Prioridade de atendimento (ALTA, MÉDIA, BAIXA)';
COMMENT ON COLUMN quiz_leads.is_hot_lead_vip IS 'Indica se é um lead VIP de alta prioridade';

-- Exibir estrutura atualizada
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'quiz_leads'
  AND column_name IN (
    'contagem_elementos',
    'intensidade_calculada', 
    'urgencia_calculada',
    'elemento_principal',
    'quadrante',
    'lead_score',
    'prioridade',
    'is_hot_lead_vip'
  )
ORDER BY ordinal_position;
