-- ========================================
-- 📊 QUERIES ÚTEIS - DASHBOARD MTC
-- ========================================

-- ==================== ANÁLISES BÁSICAS ====================

-- 1. Total de leads por elemento MTC
SELECT 
  elemento_principal,
  COUNT(*) as total_leads,
  ROUND(AVG(lead_score), 2) as score_medio,
  COUNT(CASE WHEN is_hot_lead_vip = true THEN 1 END) as hot_leads_vip
FROM quiz_leads
GROUP BY elemento_principal
ORDER BY total_leads DESC;

-- 2. Hot Leads VIP não contatados (PRIORIDADE MÁXIMA)
SELECT 
  id,
  nome,
  celular,
  elemento_principal,
  lead_score,
  quadrante,
  created_at
FROM quiz_leads
WHERE is_hot_lead_vip = true 
  AND whatsapp_status = 'AGUARDANDO_CONTATO'
ORDER BY lead_score DESC, created_at DESC;

-- 3. Leads criados hoje
SELECT 
  COUNT(*) as leads_hoje,
  COUNT(CASE WHEN is_hot_lead_vip = true THEN 1 END) as hot_leads_hoje,
  ROUND(AVG(lead_score), 2) as score_medio_hoje
FROM quiz_leads
WHERE created_at::date = CURRENT_DATE;

-- 4. Leads por prioridade
SELECT 
  prioridade,
  COUNT(*) as total,
  ROUND(COUNT(*)::numeric / (SELECT COUNT(*) FROM quiz_leads) * 100, 1) as percentual
FROM quiz_leads
GROUP BY prioridade
ORDER BY 
  CASE prioridade
    WHEN 'ALTA' THEN 1
    WHEN 'MEDIA' THEN 2
    WHEN 'BAIXA' THEN 3
  END;

-- 5. Leads por quadrante (matriz urgência x intensidade)
SELECT 
  quadrante,
  COUNT(*) as total,
  ROUND(AVG(lead_score), 2) as score_medio,
  COUNT(CASE WHEN whatsapp_status = 'CONVERTIDO' THEN 1 END) as convertidos,
  ROUND(
    COUNT(CASE WHEN whatsapp_status = 'CONVERTIDO' THEN 1 END)::numeric / 
    COUNT(*)::numeric * 100, 
    2
  ) as taxa_conversao
FROM quiz_leads
GROUP BY quadrante
ORDER BY quadrante;

-- ==================== ANÁLISES DE CONVERSÃO ====================

-- 6. Funil de vendas (conversão por estágio)
SELECT 
  whatsapp_status as estagio,
  COUNT(*) as leads,
  ROUND(
    COUNT(*)::numeric / 
    (SELECT COUNT(*) FROM quiz_leads) * 100, 
    2
  ) as percentual_total
FROM quiz_leads
GROUP BY whatsapp_status
ORDER BY 
  CASE whatsapp_status
    WHEN 'AGUARDANDO_CONTATO' THEN 1
    WHEN 'CONTATADO' THEN 2
    WHEN 'EM_CONVERSA' THEN 3
    WHEN 'QUALIFICADO' THEN 4
    WHEN 'INSCRITO' THEN 5
    WHEN 'CONVERTIDO' THEN 6
    WHEN 'NAO_RESPONDEU' THEN 7
    WHEN 'DESQUALIFICADO' THEN 8
  END;

-- 7. Taxa de conversão geral
SELECT 
  COUNT(*) as total_leads,
  COUNT(CASE WHEN whatsapp_status = 'CONVERTIDO' THEN 1 END) as convertidos,
  ROUND(
    COUNT(CASE WHEN whatsapp_status = 'CONVERTIDO' THEN 1 END)::numeric / 
    COUNT(*)::numeric * 100, 
    2
  ) as taxa_conversao_percentual
FROM quiz_leads;

-- 8. Taxa de resposta WhatsApp
SELECT 
  COUNT(*) as total_leads,
  COUNT(CASE WHEN whatsapp_status NOT IN ('AGUARDANDO_CONTATO', 'NAO_RESPONDEU') THEN 1 END) as responderam,
  ROUND(
    COUNT(CASE WHEN whatsapp_status NOT IN ('AGUARDANDO_CONTATO', 'NAO_RESPONDEU') THEN 1 END)::numeric / 
    COUNT(*)::numeric * 100, 
    2
  ) as taxa_resposta_percentual
FROM quiz_leads
WHERE whatsapp_status != 'AGUARDANDO_CONTATO';

-- ==================== ANÁLISES TEMPORAIS ====================

-- 9. Leads por dia da semana (últimos 30 dias)
SELECT 
  TO_CHAR(created_at, 'Day') as dia_semana,
  EXTRACT(DOW FROM created_at) as dia_numero,
  COUNT(*) as total_leads,
  ROUND(AVG(lead_score), 2) as score_medio
FROM quiz_leads
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY dia_semana, dia_numero
ORDER BY dia_numero;

-- 10. Evolução de leads nos últimos 7 dias
SELECT 
  created_at::date as data,
  COUNT(*) as leads_dia,
  SUM(COUNT(*)) OVER (ORDER BY created_at::date) as acumulado
FROM quiz_leads
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY created_at::date
ORDER BY data;

-- 11. Leads por horário do dia (análise de melhor horário)
SELECT 
  EXTRACT(HOUR FROM created_at) as hora,
  COUNT(*) as total_leads,
  ROUND(AVG(lead_score), 2) as score_medio
FROM quiz_leads
GROUP BY hora
ORDER BY hora;

-- ==================== ANÁLISES DEMOGRÁFICAS ====================

-- 12. Distribuição por faixa etária (P10)
SELECT 
  respostas->>'P10' as faixa_etaria,
  CASE respostas->>'P10'
    WHEN 'A' THEN '18-25 anos'
    WHEN 'B' THEN '26-35 anos'
    WHEN 'C' THEN '36-45 anos'
    WHEN 'D' THEN '46-55 anos'
    WHEN 'E' THEN '56-65 anos'
    WHEN 'F' THEN '65+ anos'
  END as descricao,
  COUNT(*) as total,
  ROUND(AVG(lead_score), 2) as score_medio
FROM quiz_leads
GROUP BY respostas->>'P10'
ORDER BY respostas->>'P10';

-- 13. Distribuição por renda mensal (P11)
SELECT 
  respostas->>'P11' as faixa_renda,
  CASE respostas->>'P11'
    WHEN 'A' THEN 'Até R$ 2.000'
    WHEN 'B' THEN 'R$ 2.000 - R$ 4.000'
    WHEN 'C' THEN 'R$ 4.000 - R$ 6.000'
    WHEN 'D' THEN 'R$ 6.000 - R$ 8.000'
    WHEN 'E' THEN 'R$ 8.000 - R$ 10.000'
    WHEN 'F' THEN 'R$ 10.000 - R$ 15.000'
    WHEN 'G' THEN 'R$ 15.000 - R$ 20.000'
    WHEN 'H' THEN 'R$ 20.000 - R$ 30.000'
    WHEN 'I' THEN 'R$ 30.000 - R$ 50.000'
    WHEN 'J' THEN 'R$ 50.000+'
  END as descricao,
  COUNT(*) as total,
  COUNT(CASE WHEN is_hot_lead_vip = true THEN 1 END) as hot_leads
FROM quiz_leads
GROUP BY respostas->>'P11'
ORDER BY respostas->>'P11';

-- 14. Novos alunos vs. já alunos (P12)
SELECT 
  CASE respostas->>'P12'
    WHEN 'A' THEN 'Já é aluno'
    WHEN 'B' THEN 'Não é aluno'
  END as status_aluno,
  COUNT(*) as total,
  ROUND(AVG(lead_score), 2) as score_medio,
  COUNT(CASE WHEN whatsapp_status = 'CONVERTIDO' THEN 1 END) as convertidos
FROM quiz_leads
GROUP BY respostas->>'P12';

-- ==================== ANÁLISES DE RESPOSTAS ====================

-- 15. Distribuição de intensidade de dor (P1)
SELECT 
  respostas->>'P1' as intensidade,
  CASE respostas->>'P1'
    WHEN 'A' THEN 'Muito intensa (20 pts)'
    WHEN 'B' THEN 'Intensa (16 pts)'
    WHEN 'C' THEN 'Moderada (12 pts)'
    WHEN 'D' THEN 'Leve (8 pts)'
    WHEN 'E' THEN 'Muito leve (4 pts)'
  END as descricao,
  COUNT(*) as total
FROM quiz_leads
GROUP BY respostas->>'P1'
ORDER BY respostas->>'P1';

-- 16. Distribuição de urgência (P8) - PERGUNTA MAIS IMPORTANTE
SELECT 
  respostas->>'P8' as urgencia,
  CASE respostas->>'P8'
    WHEN 'A' THEN 'Urgente (20 pts)'
    WHEN 'B' THEN 'Nas próximas semanas (16 pts)'
    WHEN 'C' THEN 'Próximo mês (12 pts)'
    WHEN 'D' THEN 'Não tenho pressa (8 pts)'
  END as descricao,
  COUNT(*) as total,
  COUNT(CASE WHEN is_hot_lead_vip = true THEN 1 END) as hot_leads
FROM quiz_leads
GROUP BY respostas->>'P8'
ORDER BY respostas->>'P8';

-- ==================== TOP PERFORMERS ====================

-- 17. Top 20 leads por score
SELECT 
  nome,
  celular,
  elemento_principal,
  lead_score,
  prioridade,
  quadrante,
  whatsapp_status,
  created_at
FROM quiz_leads
ORDER BY lead_score DESC
LIMIT 20;

-- 18. Leads inativos (há mais de 7 dias sem atualização)
SELECT 
  nome,
  celular,
  elemento_principal,
  lead_score,
  whatsapp_status,
  created_at,
  updated_at,
  CURRENT_DATE - updated_at::date as dias_sem_atualizacao
FROM quiz_leads
WHERE updated_at < CURRENT_DATE - INTERVAL '7 days'
  AND whatsapp_status NOT IN ('CONVERTIDO', 'DESQUALIFICADO')
ORDER BY updated_at ASC;

-- ==================== ANÁLISES AVANÇADAS ====================

-- 19. Correlação entre elemento e taxa de conversão
SELECT 
  elemento_principal,
  COUNT(*) as total_leads,
  COUNT(CASE WHEN whatsapp_status = 'CONVERTIDO' THEN 1 END) as convertidos,
  ROUND(
    COUNT(CASE WHEN whatsapp_status = 'CONVERTIDO' THEN 1 END)::numeric / 
    COUNT(*)::numeric * 100, 
    2
  ) as taxa_conversao,
  ROUND(AVG(lead_score), 2) as score_medio
FROM quiz_leads
GROUP BY elemento_principal
ORDER BY taxa_conversao DESC;

-- 20. Análise de cohort (leads por semana de criação)
SELECT 
  DATE_TRUNC('week', created_at) as semana,
  COUNT(*) as leads_criados,
  COUNT(CASE WHEN whatsapp_status = 'CONVERTIDO' THEN 1 END) as convertidos,
  ROUND(AVG(lead_score), 2) as score_medio,
  ROUND(
    COUNT(CASE WHEN whatsapp_status = 'CONVERTIDO' THEN 1 END)::numeric / 
    COUNT(*)::numeric * 100, 
    2
  ) as taxa_conversao
FROM quiz_leads
WHERE created_at >= CURRENT_DATE - INTERVAL '12 weeks'
GROUP BY semana
ORDER BY semana DESC;

-- ==================== RELATÓRIOS EXECUTIVOS ====================

-- 21. Dashboard executivo completo (última semana)
WITH stats AS (
  SELECT 
    COUNT(*) as total_leads,
    COUNT(CASE WHEN is_hot_lead_vip = true THEN 1 END) as hot_leads,
    ROUND(AVG(lead_score), 2) as score_medio,
    COUNT(CASE WHEN whatsapp_status = 'CONVERTIDO' THEN 1 END) as convertidos
  FROM quiz_leads
  WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
)
SELECT 
  total_leads as "Total Leads (7d)",
  hot_leads as "Hot Leads VIP",
  score_medio as "Score Médio",
  convertidos as "Convertidos",
  ROUND((convertidos::numeric / total_leads::numeric * 100), 2) as "Taxa Conversão %"
FROM stats;

-- 22. Ranking de elementos por performance
SELECT 
  ROW_NUMBER() OVER (ORDER BY 
    COUNT(CASE WHEN whatsapp_status = 'CONVERTIDO' THEN 1 END)::numeric / 
    COUNT(*)::numeric DESC
  ) as ranking,
  elemento_principal,
  COUNT(*) as total_leads,
  ROUND(AVG(lead_score), 2) as score_medio,
  COUNT(CASE WHEN whatsapp_status = 'CONVERTIDO' THEN 1 END) as convertidos,
  ROUND(
    COUNT(CASE WHEN whatsapp_status = 'CONVERTIDO' THEN 1 END)::numeric / 
    COUNT(*)::numeric * 100, 
    2
  ) as taxa_conversao
FROM quiz_leads
GROUP BY elemento_principal
ORDER BY taxa_conversao DESC;

-- ==================== MANUTENÇÃO E OTIMIZAÇÃO ====================

-- 23. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_quiz_leads_elemento ON quiz_leads(elemento_principal);
CREATE INDEX IF NOT EXISTS idx_quiz_leads_prioridade ON quiz_leads(prioridade);
CREATE INDEX IF NOT EXISTS idx_quiz_leads_score ON quiz_leads(lead_score);
CREATE INDEX IF NOT EXISTS idx_quiz_leads_vip ON quiz_leads(is_hot_lead_vip);
CREATE INDEX IF NOT EXISTS idx_quiz_leads_status ON quiz_leads(whatsapp_status);
CREATE INDEX IF NOT EXISTS idx_quiz_leads_created ON quiz_leads(created_at);
CREATE INDEX IF NOT EXISTS idx_quiz_leads_quadrante ON quiz_leads(quadrante);

-- 24. Atualizar timestamp automaticamente (trigger)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_quiz_leads_updated_at 
BEFORE UPDATE ON quiz_leads
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 25. View materializada para dashboard (cache)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_dashboard_stats AS
SELECT 
  COUNT(*) as total_leads,
  COUNT(CASE WHEN is_hot_lead_vip = true THEN 1 END) as hot_leads_vip,
  ROUND(AVG(lead_score), 2) as lead_score_medio,
  COUNT(CASE WHEN created_at::date = CURRENT_DATE THEN 1 END) as leads_hoje,
  COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as leads_semana,
  COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as leads_mes,
  COUNT(CASE WHEN whatsapp_status = 'CONVERTIDO' THEN 1 END) as total_convertidos,
  ROUND(
    COUNT(CASE WHEN whatsapp_status = 'CONVERTIDO' THEN 1 END)::numeric / 
    COUNT(*)::numeric * 100, 
    2
  ) as taxa_conversao
FROM quiz_leads;

-- Refresh da view (executar periodicamente)
REFRESH MATERIALIZED VIEW mv_dashboard_stats;

-- ==================== LIMPEZA E BACKUP ====================

-- 26. Backup de leads (exportar para tabela histórica)
CREATE TABLE IF NOT EXISTS quiz_leads_backup AS 
SELECT * FROM quiz_leads WHERE 1=0;

INSERT INTO quiz_leads_backup 
SELECT * FROM quiz_leads 
WHERE created_at < CURRENT_DATE - INTERVAL '6 months';

-- 27. Remover leads duplicados (por celular)
DELETE FROM quiz_leads a
USING quiz_leads b
WHERE a.id > b.id
  AND a.celular = b.celular;

-- 28. Estatísticas da tabela
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes
FROM pg_stat_user_tables
WHERE tablename = 'quiz_leads';

-- ========================================
-- 📝 NOTAS DE USO
-- ========================================

/*
IMPORTANTE:
- Execute os índices (query 23) para melhor performance
- Configure o trigger (query 24) para auto-update do timestamp
- Refresh a view materializada (query 25) a cada hora
- Faça backup regular com query 26

PERFORMANCE:
- Índices melhoram consultas em até 10x
- View materializada reduz carga no banco
- Use EXPLAIN ANALYZE para otimizar queries lentas

MANUTENÇÃO:
- Limpe leads duplicados mensalmente (query 27)
- Monitore tamanho da tabela (query 28)
- Faça VACUUM ANALYZE periodicamente
*/