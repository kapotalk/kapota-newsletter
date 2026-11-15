-- O painel de audiência marca a mensagem como "lida" quando abre.
-- SQLite não altera CHECK: recria a tabela com o mesmo conteúdo.
CREATE TABLE contacts_novo (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  assunto TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'nova' CHECK (status IN ('nova', 'lida', 'respondida', 'arquivada')),
  created_at TEXT NOT NULL
);
INSERT INTO contacts_novo (id, nome, email, assunto, mensagem, status, created_at)
  SELECT id, nome, email, assunto, mensagem, status, created_at FROM contacts;
DROP TABLE contacts;
ALTER TABLE contacts_novo RENAME TO contacts;
CREATE INDEX idx_contacts_created_at ON contacts (created_at);
