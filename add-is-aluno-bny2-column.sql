-- add-is-aluno-bny2-column.sql
-- Adiciona coluna para marcar alunos da campanha BNY2

-- 1. Adicionar coluna
ALTER TABLE quiz_leads 
ADD COLUMN IF NOT EXISTS is_aluno_bny2 BOOLEAN DEFAULT false;

-- 2. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_quiz_leads_is_aluno_bny2 
ON quiz_leads(is_aluno_bny2);

-- 3. Criar índice composto para filtros de campanha
CREATE INDEX IF NOT EXISTS idx_quiz_leads_is_aluno_bny2_elemento 
ON quiz_leads(is_aluno_bny2, elemento_principal);

-- Verificar estrutura
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'quiz_leads' 
AND column_name LIKE '%aluno%'
ORDER BY ordinal_position;
