-- Deletar registro de quiz_leads com email equipe@persona.cx
DELETE FROM quiz_leads 
WHERE email = 'equipe@persona.cx';

-- Verificar registros deletados
SELECT COUNT(*) as registros_deletados 
FROM quiz_leads 
WHERE email = 'equipe@persona.cx';
