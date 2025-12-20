-- ========================================
-- VERIFICAR ESTRUTURA COMPLETA DA TABELA quiz_leads
-- Execute este SQL no Supabase SQL Editor
-- ========================================

-- 1. LISTAR TODAS AS COLUNAS E TIPOS
SELECT 
    column_name AS "Coluna",
    data_type AS "Tipo",
    character_maximum_length AS "Tamanho",
    is_nullable AS "Permite NULL?",
    column_default AS "Valor Padrão"
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'quiz_leads'
ORDER BY ordinal_position;

-- ========================================

-- 2. LISTAR TODOS OS ÍNDICES
SELECT
    indexname AS "Nome do Índice",
    indexdef AS "Definição"
FROM pg_indexes
WHERE tablename = 'quiz_leads'
  AND schemaname = 'public'
ORDER BY indexname;

-- ========================================

-- 3. VERIFICAR CAMPOS ESPECÍFICOS DE ARQUÉTIPOS
SELECT 
    column_name,
    data_type,
    CASE 
        WHEN column_name IN (
            'arquetipo_principal',
            'scores_arquetipos',
            'confianca_arquetipo',
            'objecao_principal',
            'autonomia_decisao',
            'investimento_mensal_atual'
        ) THEN '✅ EXISTE'
        ELSE ''
    END AS status_arquetipo
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'quiz_leads'
ORDER BY 
    CASE 
        WHEN column_name IN (
            'arquetipo_principal',
            'scores_arquetipos',
            'confianca_arquetipo',
            'objecao_principal',
            'autonomia_decisao',
            'investimento_mensal_atual'
        ) THEN 0
        ELSE 1
    END,
    ordinal_position;

-- ========================================

-- 4. CONTAR LEADS COM E SEM ARQUÉTIPOS
SELECT 
    COUNT(*) AS total_leads,
    COUNT(arquetipo_principal) AS leads_com_arquetipo,
    COUNT(*) - COUNT(arquetipo_principal) AS leads_sem_arquetipo,
    ROUND(
        (COUNT(arquetipo_principal)::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 
        2
    ) AS percentual_com_arquetipo
FROM quiz_leads;

-- ========================================

-- 5. VERIFICAR SAMPLE DE DADOS (últimos 3 leads)
SELECT 
    id,
    nome,
    email,
    elemento_principal,
    lead_score,
    arquetipo_principal,
    objecao_principal,
    autonomia_decisao,
    created_at
FROM quiz_leads
ORDER BY created_at DESC
LIMIT 3;

-- ========================================
-- INTERPRETAÇÃO DOS RESULTADOS:
-- ========================================
--
-- Query 1: Mostra TODAS as colunas da tabela
-- Query 2: Mostra todos os índices criados
-- Query 3: Destaca campos de arquétipos (se existirem)
-- Query 4: Estatística de preenchimento de arquétipos
-- Query 5: Amostra dos últimos 3 leads inseridos
--
-- ========================================
