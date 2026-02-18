-- =============================================
-- Tabela admin_config - Configurações dinâmicas (SAFE VERSION)
-- =============================================

-- Criar tabela se não existir
CREATE TABLE IF NOT EXISTS admin_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  config_key TEXT NOT NULL UNIQUE,
  config_value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT DEFAULT 'admin'
);

CREATE INDEX IF NOT EXISTS idx_admin_config_key ON admin_config(config_key);

COMMENT ON TABLE admin_config IS 'Configurações dinâmicas do sistema, gerenciadas pelo painel admin';

-- RLS: leitura pública (frontend precisa ler), escrita via API protegida
ALTER TABLE admin_config ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist and recreate
DROP POLICY IF EXISTS admin_config_read_all ON admin_config;
DROP POLICY IF EXISTS admin_config_write_all ON admin_config;
DROP POLICY IF EXISTS admin_config_update_all ON admin_config;
DROP POLICY IF EXISTS admin_config_delete_all ON admin_config;

-- Recreate policies
CREATE POLICY admin_config_read_all ON admin_config
  FOR SELECT USING (true);

CREATE POLICY admin_config_write_all ON admin_config
  FOR INSERT WITH CHECK (true);

CREATE POLICY admin_config_update_all ON admin_config
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY admin_config_delete_all ON admin_config
  FOR DELETE USING (true);

-- =============================================
-- SEED: Dados iniciais (valores atuais do código)
-- =============================================

-- 1. Funis
INSERT INTO admin_config (config_key, config_value) VALUES ('funis', '{
  "perpetuo_url": "/resultados.html",
  "lancamento_url": "https://mestre-ye.vercel.app"
}'::jsonb)
ON CONFLICT (config_key) DO UPDATE SET
  config_value = EXCLUDED.config_value,
  updated_at = NOW();

-- 2. WhatsApp
INSERT INTO admin_config (config_key, config_value) VALUES ('whatsapp', '{
  "enabled": true,
  "rate_limit": 20,
  "hot_lead_delay_ms": 0,
  "normal_lead_delay_ms": 10000,
  "horario_inicio": 0,
  "horario_fim": 23,
  "simulation_mode": false
}'::jsonb)
ON CONFLICT (config_key) DO UPDATE SET
  config_value = EXCLUDED.config_value,
  updated_at = NOW();

-- 3. Depoimentos (valores atuais com textos completos do fallback)
INSERT INTO admin_config (config_key, config_value) VALUES ('depoimentos', '{
  "ansiedade": [
    { "imagem": "/testimonials/valda-qi-gong-danca.png", "alt": "valdamariadossantos: Eu gosto muito de Qi Gong. Eu conheci através de jornalista, tornou-se mestre e tem um canal no YouTube. Sou apaixonada pelos movimentos. É uma dança pra mim. É muito lindo e prazeroso. Eu preciso de disciplina para dar continuidade." },
    { "imagem": "/testimonials/georgette-equilibrio.jpg", "alt": "Georgette Abdou Da Silva: Aulas maravilhosas. Me auxilia em tudo! Equilibrio fisico e mental, coordenação motora, reduz a ansiedade, o corpo fica leve e ao mesmo tempo forte." },
    { "imagem": "/testimonials/luiza-ansiedade-acalmou.jpg", "alt": "Luiza Maria Saucedo Corrêa: Tinha ansiedade. Depois que comecei fazer as aulas acalmou." }
  ],
  "dor_lombar": [
    { "imagem": "/testimonials/dor-lombar-sueli.png", "alt": "Sueli Torres Rodrigues: Estava com muita dor na lombar, melhorou bastante" },
    { "imagem": "/testimonials/dor-mariza-sumiu.png", "alt": "Mariza Belmonte: A minha dor praticamente sumiu!! Obrigada" }
  ],
  "dor_geral": [
    { "imagem": "/testimonials/dor-mariza-sumiu.png", "alt": "Mariza Belmonte: A minha dor praticamente sumiu!! Obrigada" },
    { "imagem": "/testimonials/dor-lombar-sueli.png", "alt": "Sueli Torres Rodrigues: Estava com muita dor na lombar, melhorou bastante" },
    { "imagem": "/testimonials/marta-dores-flexibilidade.png", "alt": "@martadias8015: Sou aluna #14. Praticando desde março 25 já sinto muitos resultados em dores e flexibilidade. Gracias Mestre Ye" }
  ],
  "insonia": [
    { "imagem": "/testimonials/mara-artrite-sono.jpg", "alt": "maraocabral: Mestre tenho artrite desde de jovem, suas práticas me ajudam muito, meu sono melhorou muito, desde q vi seu vídeo sobre a qualidade do sono, muito obrigada, sua filhinha é linda" },
    { "imagem": "/testimonials/lourdes-renovada-filha-autista.png", "alt": "Lourdes Brum: Me senti renovada, nos meus 72 anos. Tambem minha filha Autista, Nível 1 de suporte, que tem 39 anos e acompanhou os exercícios e está tendo um sono mais profundo e único da noite até de manhã" }
  ],
  "zumbido": [
    { "imagem": "/testimonials/zumbido-mteresaguedes.jpeg", "alt": "mteresaguedes: Muito obrigada, mestre. Essa massagem funcionou comigo. Diminuiu o volume do zumbido, que estava insuportável. Vou continuar fazendo. Obrigada" },
    { "imagem": "/testimonials/zumbido-silvinhapereira.jpeg", "alt": "silvinhapereirafl oripa: Faço já dois exercícios que ensinasse este terceiro bom também. Tenho melhorado muito. Gratidão. Os zumbidos começaram a pouco tempo mas incomodam. Os exercícios são ótimos. Agradeço." },
    { "imagem": "/testimonials/zumbido-ouvido-tampado.jpeg", "alt": "solange.giglio: Nossa dói mesmo, e mais do lado direito que sempre estou com o ouvido tampado. Lado esquerdo não senti dor!! Grata pelos ensinamentos, sempre indico você para as pessoas" },
    { "imagem": "/testimonials/zumbido-bigorna-tambor.jpeg", "alt": "marilsasantini: Eu tenho um tipo de zumbido que parece o bater de uma bigorna. O tambor me ajudou muito!!! Gratidão" }
  ],
  "universal": [
    { "imagem": "/testimonials/dor-mariza-sumiu.png", "alt": "Mariza Belmonte: A minha dor praticamente sumiu!! Obrigada" },
    { "imagem": "/testimonials/dor-lombar-sueli.png", "alt": "Sueli Torres Rodrigues: Estava com muita dor na lombar, melhorou bastante" },
    { "imagem": "/testimonials/cosarcadandu-corpo-modelando.png", "alt": "cosarcadandu: Agora posso ir dormir, feliz e em paz. Os seus exercícios são saúde na minha vida. Logo depois que pratico os seus exercícios fico bem. Quando eu era pequena fiz ginástica de performance e isso agora me ajuda conseguir fazer os exercícios bastante bem. Sem duvida eu não conheço a cultura dessa pratica do chi cong. Esses exercícios são uma grande alegria na minha vida." },
    { "imagem": "/testimonials/ana-maria-energia-vital.jpg", "alt": "Ana Maria Batista De Jesus: Mestre Ye, a prática do Qi Gong em mim, apesar de pouco tempo, tem despertado minha energia vital de uma maneira consciente e prazerosa. Estou mais alegre, descontraída!" },
    { "imagem": "/testimonials/georgette-equilibrio.jpg", "alt": "Georgette Abdou Da Silva: Aulas maravilhosas. Me auxilia em tudo! Equilibrio fisico e mental, coordenação motora, reduz a ansiedade, o corpo fica leve e ao mesmo tempo forte." },
    { "imagem": "/testimonials/marta-dores-flexibilidade.png", "alt": "@martadias8015: Sou aluna #14. Praticando desde março 25 já sinto muitos resultados em dores e flexibilidade. Gracias Mestre Ye" }
  ]
}'::jsonb)
ON CONFLICT (config_key) DO UPDATE SET
  config_value = EXCLUDED.config_value,
  updated_at = NOW();

-- 4. Produtos (valores atuais)
INSERT INTO admin_config (config_key, config_value) VALUES ('produtos', '{
  "preventiva": {
    "nome": "PREVENTIVA: O Plano de Saúde da MTC",
    "preco": 4764,
    "de": 5800,
    "parcelas": "12x de R$ 397",
    "url": "https://curso.qigongbrasil.com/pay/plano-de-saude?utm_source=digital-mestre-ye",
    "categoria": "high-end",
    "minScore": 50,
    "beneficios": [
      "Consultas mensais personalizadas com Mestre Ye",
      "Diagnóstico completo de Medicina Chinesa",
      "Práticas de Qi Gong específicas para seu ${elementoNome}",
      "Acompanhamento personalizado por 12 meses",
      "Receba cuidados preventivos contínuos",
      "Evite doenças antes que apareçam"
    ]
  },
  "qigongCompleto": {
    "nome": "Saúde & Longevidade Qi Gong",
    "preco": 1197,
    "de": 1697,
    "url": "https://curso.qigongbrasil.com/pay/qig-ob?utm_source=digital-mestre-ye",
    "categoria": "back-end",
    "minScore": 40,
    "beneficios": [
      "Curso completo de Qi Gong com exercícios diários",
      "Aumente sua energia e vitalidade naturais",
      "Fortaleça o corpo e promova longevidade",
      "Acesso por 1 ano a todo conteúdo"
    ]
  },
  "protocoloLombar": {
    "nome": "Protocolo Intensivo Dor na Lombar",
    "preco": 997,
    "url": "https://curso.qigongbrasil.com/pay/pdl-mestre-ye?utm_source=digital-mestre-ye",
    "sintomas": ["dor_lombar", "dor_costas", "coluna"],
    "beneficios": [
      "Protocolo de 21 dias para eliminar dor lombar",
      "Exercícios e técnicas específicas",
      "Recupere mobilidade e qualidade de vida"
    ]
  },
  "protocoloZumbido": {
    "nome": "Protocolo Intensivo Zumbido/Labirintite",
    "preco": 697,
    "de": 997,
    "url": "https://curso.qigongbrasil.com/pay/mestre-ye-czl?utm_source=digital-mestre-ye",
    "sintomas": ["zumbido", "tontura", "labirintite"],
    "beneficios": [
      "Alivie ou elimine zumbido naturalmente",
      "Recupere seu equilíbrio e bem-estar",
      "Técnicas comprovadas da MTC"
    ]
  },
  "workshop5Elementos": {
    "nome": "5 Elementos da Medicina Chinesa",
    "preco": 297,
    "de": 497,
    "url": "https://curso.qigongbrasil.com/pay/elementos-medicina-tradicional-chinesa?utm_source=digital-mestre-ye",
    "categoria": "workshop",
    "elementos": ["todos"],
    "beneficios": [
      "Workshop ao vivo sobre o poder dos 5 Elementos",
      "Entenda como ${elementoNome} influencia sua saúde",
      "Aplique conhecimento no dia a dia"
    ]
  },
  "toqueCura": {
    "nome": "Toque da Cura: Os 7 Pontos da Vitalidade",
    "preco": 297,
    "de": 497,
    "url": "https://curso.qigongbrasil.com/pay/toque-da-cura?utm_source=digital-mestre-ye",
    "categoria": "workshop",
    "beneficios": [
      "Curso de Tui Na (acupressão)",
      "Alivie tensões e melhore circulação",
      "Técnicas de auto-aplicação"
    ]
  },
  "soproCura": {
    "nome": "Sopro da Cura: Mantras & Respirações",
    "preco": 297,
    "de": 497,
    "url": "https://curso.qigongbrasil.com/pay/mantra-e-respiracao?utm_source=digital-mestre-ye",
    "categoria": "workshop",
    "elementos": ["CORACAO", "PULMAO"],
    "beneficios": [
      "Técnicas ancestrais de mantras curativos",
      "Respirações conscientes da MTC",
      "Libere feridas emocionais e acalme a mente"
    ]
  },
  "diagnostico": {
    "nome": "Diagnóstico MTC Completo",
    "preco": 29.90,
    "de": 197,
    "url": "https://mestreye.com/diagnostico-mtc?utm_source=digital-mestre-ye",
    "categoria": "front-end",
    "beneficios": [
      "Consulta de 45 minutos",
      "Análise de pulso e língua",
      "Diagnóstico energético completo",
      "Plano personalizado de cuidados"
    ]
  },
  "mestreYeDigital": {
    "nome": "Mestre Ye Digital - Terapeuta IA",
    "preco": 29.90,
    "de": 129.90,
    "recorrente": true,
    "url": "https://digital.mestreye.com/chat?utm_source=digital-mestre-ye",
    "categoria": "front-end",
    "beneficios": [
      "IA treinada pelo Mestre Ye",
      "Orientações personalizadas 24/7",
      "Práticas adaptadas para você",
      "Cancele quando quiser"
    ]
  },
  "saudeTodos": {
    "nome": "Saúde Para Todos - Aulas Semanais",
    "preco": 97,
    "recorrente": true,
    "url": "https://curso.qigongbrasil.com/pay/spt?utm_source=digital-mestre-ye",
    "categoria": "front-end",
    "beneficios": [
      "Aulas ao vivo online 4x por semana",
      "Práticas de Qi Gong com Mestre Ye",
      "Assinatura mensal - cancele quando quiser",
      "Comunidade de apoio exclusiva"
    ]
  },
  "ebookLombar": {
    "nome": "E-book: Método Ye Xin para Lombar",
    "preco": 29,
    "url": "https://curso.qigongbrasil.com/pay/ebook-mestre-ye?utm_source=digital-mestre-ye",
    "sintomas": ["dor_lombar", "dor_costas"],
    "beneficios": [
      "Exercícios específicos para lombar",
      "Fortaleça a região com Qi Gong",
      "Acesso vitalício"
    ]
  },
  "retiroQigong": {
    "nome": "Retiro de Qi Gong com Mestre Ye",
    "preco": 3997,
    "url": "https://retiro.qigongbrasil.com/?utm_source=digital-mestre-ye",
    "categoria": "evento-presencial",
    "data": "3 dias de imersão completa",
    "beneficios": [
      "3 dias de práticas intensivas de Qi Gong",
      "Hospedagem completa em hotel fazenda",
      "Alimentação vegetariana incluída",
      "Aulas presenciais com Mestre Ye",
      "Experiência transformadora em grupo",
      "Conexão profunda com a natureza"
    ]
  }
}'::jsonb)
ON CONFLICT (config_key) DO UPDATE SET
  config_value = EXCLUDED.config_value,
  updated_at = NOW();
