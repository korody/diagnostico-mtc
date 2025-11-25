-- ========================================
-- SCRIPT SQL: Adicionar colunas de auto-signup em quiz_leads
-- ========================================
-- Execute no Supabase SQL Editor
-- ========================================

-- Adicionar coluna user_id (FK para auth.users)
ALTER TABLE quiz_leads 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Adicionar coluna redirect_url (para magic link)
ALTER TABLE quiz_leads
ADD COLUMN IF NOT EXISTS redirect_url TEXT;

-- Criar índice para queries por user_id
CREATE INDEX IF NOT EXISTS idx_quiz_leads_user_id ON quiz_leads(user_id);

-- Adicionar comentários
COMMENT ON COLUMN quiz_leads.user_id IS 'Referência ao usuário autenticado (criado automaticamente no quiz)';
COMMENT ON COLUMN quiz_leads.redirect_url IS 'URL de redirecionamento com magic link token para autenticação automática';

-- Verificar estrutura atualizada
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'quiz_leads'
  AND column_name IN ('user_id', 'redirect_url', 'email', 'celular')
ORDER BY ordinal_position;
