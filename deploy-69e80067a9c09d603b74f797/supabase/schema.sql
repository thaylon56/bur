-- Execute este SQL no Supabase: SQL Editor > New query > Run

-- Tabela de clientes
CREATE TABLE IF NOT EXISTS clientes (
  cpf TEXT PRIMARY KEY,
  nome TEXT NOT NULL DEFAULT '',
  pontos INTEGER NOT NULL DEFAULT 0 CHECK (pontos >= 0),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de movimentações de pontos
CREATE TABLE IF NOT EXISTS movimentacoes_pontos (
  id BIGSERIAL PRIMARY KEY,
  cpf TEXT NOT NULL REFERENCES clientes(cpf) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('ganho', 'resgate')),
  pontos INTEGER NOT NULL CHECK (pontos > 0),
  valor_reais NUMERIC(10, 2) NOT NULL DEFAULT 0,
  descricao TEXT NOT NULL DEFAULT '',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_movimentacoes_cpf ON movimentacoes_pontos(cpf);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_criado_em ON movimentacoes_pontos(criado_em DESC);

-- Políticas RLS (necessárias para uso com chave anon no frontend)
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimentacoes_pontos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura de clientes"
  ON clientes FOR SELECT
  USING (true);

CREATE POLICY "Permitir inserção de clientes"
  ON clientes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Permitir atualização de clientes"
  ON clientes FOR UPDATE
  USING (true);

CREATE POLICY "Permitir leitura de movimentações"
  ON movimentacoes_pontos FOR SELECT
  USING (true);

CREATE POLICY "Permitir inserção de movimentações"
  ON movimentacoes_pontos FOR INSERT
  WITH CHECK (true);
