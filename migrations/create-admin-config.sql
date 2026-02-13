-- =============================================
-- Tabela admin_config - Configurações dinâmicas
-- =============================================

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

CREATE POLICY "admin_config_read_all" ON admin_config
  FOR SELECT USING (true);

CREATE POLICY "admin_config_write_all" ON admin_config
  FOR INSERT WITH CHECK (true);

CREATE POLICY "admin_config_update_all" ON admin_config
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "admin_config_delete_all" ON admin_config
  FOR DELETE USING (true);

-- =============================================
-- SEED: Dados iniciais (valores atuais do código)
-- =============================================

-- 1. Funis
INSERT INTO admin_config (config_key, config_value) VALUES ('funis', '{
  "perpetuo_url": "/resultados.html",
  "lancamento_url": "https://mestre-ye.vercel.app"
}'::jsonb)
ON CONFLICT (config_key) DO NOTHING;

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
ON CONFLICT (config_key) DO NOTHING;

-- 3. Depoimentos (valores atuais)
INSERT INTO admin_config (config_key, config_value) VALUES ('depoimentos', '{
  "ansiedade": [
    { "imagem": "/testimonials/valda-qi-gong-danca.png", "alt": "valdamariadossantos: Eu gosto muito de Qi Gong. É uma dança pra mim. É muito lindo e prazeroso." },
    { "imagem": "/testimonials/georgette-equilibrio.jpg", "alt": "Georgette Abdou Da Silva: Aulas maravilhosas. Equilibrio fisico e mental, reduz a ansiedade, o corpo fica leve e ao mesmo tempo forte." },
    { "imagem": "/testimonials/luiza-ansiedade-acalmou.jpg", "alt": "Luiza Maria Saucedo Corrêa: Tinha ansiedade. Depois que comecei fazer as aulas acalmou." }
  ],
  "dor_lombar": [
    { "imagem": "/testimonials/dor-lombar-sueli.png", "alt": "Sueli Torres Rodrigues: Estava com muita dor na lombar, melhorou bastante" },
    { "imagem": "/testimonials/dor-mariza-sumiu.png", "alt": "Mariza Belmonte: A minha dor praticamente sumiu!! Obrigada" }
  ],
  "dor_geral": [
    { "imagem": "/testimonials/dor-mariza-sumiu.png", "alt": "Mariza Belmonte: A minha dor praticamente sumiu!! Obrigada" },
    { "imagem": "/testimonials/dor-lombar-sueli.png", "alt": "Sueli Torres Rodrigues: Estava com muita dor na lombar, melhorou bastante" },
    { "imagem": "/testimonials/marta-dores-flexibilidade.png", "alt": "@martadias8015: Praticando desde março 25 já sinto muitos resultados em dores e flexibilidade." }
  ],
  "insonia": [
    { "imagem": "/testimonials/mara-artrite-sono.jpg", "alt": "maraocabral: Tenho artrite desde jovem, suas práticas me ajudam muito, meu sono melhorou muito" },
    { "imagem": "/testimonials/lourdes-renovada-filha-autista.png", "alt": "Lourdes Brum: Me senti renovada, nos meus 72 anos. Filha Autista está tendo um sono mais profundo." }
  ],
  "zumbido": [
    { "imagem": "/testimonials/zumbido-mteresaguedes.jpeg", "alt": "mteresaguedes: Diminuiu o volume do zumbido, que estava insuportável." },
    { "imagem": "/testimonials/zumbido-silvinhapereira.jpeg", "alt": "silvinhapereira: Tenho melhorado muito. Os exercícios são ótimos." },
    { "imagem": "/testimonials/zumbido-ouvido-tampado.jpeg", "alt": "solange.giglio: Grata pelos ensinamentos, sempre indico você para as pessoas" },
    { "imagem": "/testimonials/zumbido-bigorna-tambor.jpeg", "alt": "marilsasantini: Zumbido que parece o bater de uma bigorna. O tambor me ajudou muito!!!" }
  ],
  "universal": [
    { "imagem": "/testimonials/dor-mariza-sumiu.png", "alt": "Mariza Belmonte: A minha dor praticamente sumiu!! Obrigada" },
    { "imagem": "/testimonials/dor-lombar-sueli.png", "alt": "Sueli Torres Rodrigues: Estava com muita dor na lombar, melhorou bastante" },
    { "imagem": "/testimonials/cosarcadandu-corpo-modelando.png", "alt": "cosarcadandu: Os seus exercícios são saúde na minha vida." },
    { "imagem": "/testimonials/ana-maria-energia-vital.jpg", "alt": "Ana Maria Batista De Jesus: Tem despertado minha energia vital de uma maneira consciente e prazerosa." },
    { "imagem": "/testimonials/georgette-equilibrio.jpg", "alt": "Georgette Abdou Da Silva: Equilibrio fisico e mental, reduz a ansiedade." },
    { "imagem": "/testimonials/marta-dores-flexibilidade.png", "alt": "@martadias8015: Resultados em dores e flexibilidade." }
  ]
}'::jsonb)
ON CONFLICT (config_key) DO NOTHING;

-- 4. Produtos (valores atuais)
INSERT INTO admin_config (config_key, config_value) VALUES ('produtos', '{
  "preventiva": {
    "nome": "PREVENTIVA: O Plano de Saúde da MTC",
    "preco": 4764,
    "de": 5800,
    "parcelas": "12x de R$ 397",
    "url": "https://curso.qigongbrasil.com/pay/plano-de-saude",
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
    "url": "https://curso.qigongbrasil.com/pay/qig-ob",
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
    "url": "https://curso.qigongbrasil.com/pay/pdl-mestre-ye",
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
    "url": "https://curso.qigongbrasil.com/pay/mestre-ye-czl",
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
    "url": "https://curso.qigongbrasil.com/pay/elementos-medicina-tradicional-chinesa",
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
    "url": "https://curso.qigongbrasil.com/pay/toque-da-cura",
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
    "url": "https://curso.qigongbrasil.com/pay/mantra-e-respiracao",
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
    "url": "https://mestreye.com/diagnostico-mtc",
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
    "url": "https://digital.mestreye.com/chat",
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
    "url": "https://curso.qigongbrasil.com/pay/spt",
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
    "url": "https://curso.qigongbrasil.com/pay/ebook-mestre-ye",
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
    "url": "https://retiro.qigongbrasil.com/",
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
ON CONFLICT (config_key) DO NOTHING;
