CREATE TABLE contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  assunto TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'nova' CHECK (status IN ('nova', 'respondida', 'arquivada')),
  created_at TEXT NOT NULL
);
CREATE INDEX idx_contacts_created_at ON contacts (created_at);
