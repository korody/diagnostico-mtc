-- ========================================
-- VERIFICAÇÃO COMPLETA DE CAMPOS NO BANCO
-- Execute no Supabase SQL Editor
-- ========================================

-- Verificar TODOS os campos necessários
SELECT 
    column_name,
    data_type,
    CASE 
        WHEN column_name IN (
            'perfil_comercial',
            'scores_arquetipos',
            'confianca_arquetipo',
            'objecao_principal',
            'autonomia_decisao',
            'investimento_mensal_atual'
        ) THEN '🎯 ARQUÉTIPOS'
        WHEN column_name IN (
            'estado',
            'custo_mensal_problema'
        ) THEN '📍 SEGMENTAÇÃO/QUALIFICAÇÃO'
        WHEN column_name IN (
            'elemento_principal',
            'quadrante',
            'lead_score',
            'prioridade',
            'is_hot_lead_vip',
            'contagem_elementos',
            'intensidade_calculada',
            'urgencia_calculada'
        ) THEN '🏥 MTC/SCORING'
        WHEN column_name IN (
            'user_id',
            'redirect_url'
        ) THEN '🔐 AUTH'
        ELSE '📋 BASE'
    END as categoria,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'quiz_leads'
  AND table_schema = 'public'
ORDER BY 
    CASE 
        WHEN column_name IN ('id', 'nome', 'email', 'celular', 'respostas', 'created_at', 'updated_at') THEN 1
        WHEN column_name IN ('elemento_principal', 'quadrante', 'lead_score', 'prioridade', 'is_hot_lead_vip', 'contagem_elementos', 'intensidade_calculada', 'urgencia_calculada') THEN 2
        WHEN column_name IN ('perfil_comercial', 'scores_arquetipos', 'confianca_arquetipo', 'objecao_principal', 'autonomia_decisao', 'investimento_mensal_atual') THEN 3
        WHEN column_name IN ('estado', 'custo_mensal_problema') THEN 4
        WHEN column_name IN ('user_id', 'redirect_url') THEN 5
        ELSE 6
    END,
    column_name;

-- ========================================
-- CHECKLIST DE CAMPOS NECESSÁRIOS
-- ========================================

-- Se esta query retornar 8, todos os campos foram adicionados corretamente
SELECT 
    COUNT(*) as total_campos_novos,
    COUNT(*) FILTER (WHERE column_name = 'perfil_comercial') as tem_perfil_comercial,
    COUNT(*) FILTER (WHERE column_name = 'scores_arquetipos') as tem_scores_arquetipos,
    COUNT(*) FILTER (WHERE column_name = 'confianca_arquetipo') as tem_confianca_arquetipo,
    COUNT(*) FILTER (WHERE column_name = 'objecao_principal') as tem_objecao_principal,
    COUNT(*) FILTER (WHERE column_name = 'autonomia_decisao') as tem_autonomia_decisao,
    COUNT(*) FILTER (WHERE column_name = 'investimento_mensal_atual') as tem_investimento_mensal,
    COUNT(*) FILTER (WHERE column_name = 'estado') as tem_estado,
    COUNT(*) FILTER (WHERE column_name = 'custo_mensal_problema') as tem_custo_mensal
FROM information_schema.columns
WHERE table_name = 'quiz_leads' 
  AND table_schema = 'public'
  AND column_name IN (
    'perfil_comercial',
    'scores_arquetipos',
    'confianca_arquetipo',
    'objecao_principal',
    'autonomia_decisao',
    'investimento_mensal_atual',
    'estado',
    'custo_mensal_problema'
  );

-- ========================================
-- RESULTADO ESPERADO:
-- ========================================
-- 
-- total_campos_novos: 8
-- tem_perfil_comercial: 1
-- tem_scores_arquetipos: 1
-- tem_confianca_arquetipo: 1
-- tem_objecao_principal: 1
-- tem_autonomia_decisao: 1
-- tem_investimento_mensal: 1
-- tem_estado: 1
-- tem_custo_mensal: 1
--
-- Se TODOS forem 1 = ✅ COMPLETO
-- Se algum for 0 = ❌ Falta executar script
-- ========================================

-- ========================================
-- SCRIPTS A EXECUTAR (SE NECESSÁRIO):
-- ========================================
--
-- 1. Se campos de ARQUÉTIPOS = 0:
--    → Executar: scripts/add-arquetipo-columns.sql
--
-- 2. Se campos de SEGMENTAÇÃO = 0:
--    → Executar: scripts/add-segmentacao-qualificacao-columns.sql
--
-- ========================================
