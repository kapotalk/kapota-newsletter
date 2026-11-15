-- Cadastro pra liberar os materiais de conteudos.kapota.com.br (15/11/2026).
-- Uma pessoa por email. O cadastro libera todos os materiais no aparelho dela, por um
-- cookie com token aleatório (aqui fica só o hash). Quem se cadastra num aparelho novo
-- reaproveita a mesma linha.
CREATE TABLE material_leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  whatsapp TEXT NOT NULL,
  material TEXT NOT NULL,
  newsletter INTEGER NOT NULL DEFAULT 0,
  consentimento TEXT NOT NULL,
  created_at TEXT NOT NULL,
  atualizado_em TEXT NOT NULL
);
CREATE INDEX idx_material_leads_created ON material_leads (created_at);
CREATE INDEX idx_material_leads_material ON material_leads (material);

CREATE TABLE material_acessos (
  token_hash TEXT PRIMARY KEY,
  lead_id INTEGER NOT NULL REFERENCES material_leads(id),
  created_at TEXT NOT NULL
);

-- Nome de cada material e quantas vezes a tela de cadastro foi aberta (sem identificar ninguém).
CREATE TABLE materiais (
  slug TEXT PRIMARY KEY,
  titulo TEXT NOT NULL,
  visitas INTEGER NOT NULL DEFAULT 0,
  atualizado_em TEXT NOT NULL
);

-- Quem abriu o material e quem chegou na última tela: uma linha por pessoa, material e tipo.
CREATE TABLE material_eventos (
  lead_id INTEGER NOT NULL REFERENCES material_leads(id),
  material TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('abriu', 'fim')),
  created_at TEXT NOT NULL,
  PRIMARY KEY (lead_id, material, tipo)
);
