-- Adicionar coluna 'funil' na tabela leads
-- Permite rastrear de qual funil o lead veio (perpetuo ou lancamento)

-- Adicionar coluna se não existir
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS funil TEXT DEFAULT 'perpetuo';

-- Criar índice para queries mais rápidas
CREATE INDEX IF NOT EXISTS idx_leads_funil ON leads(funil);

-- Adicionar comentário na coluna
COMMENT ON COLUMN leads.funil IS 'Tipo de funil de origem: perpetuo ou lancamento';

-- Atualizar leads existentes que não têm funil definido
UPDATE leads
SET funil = 'perpetuo'
WHERE funil IS NULL;
