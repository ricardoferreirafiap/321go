CREATE TABLE IF NOT EXISTS public.financeiro (
  id BIGSERIAL PRIMARY KEY,
  tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('receita', 'despesa')),
  descricao VARCHAR(255) NOT NULL,
  valor NUMERIC(14, 2) NOT NULL CHECK (valor > 0),
  comissao_percentual NUMERIC(7, 2),
  comissao_valor NUMERIC(14, 2),
  data_lancamento DATE NOT NULL,
  oculto BOOLEAN NOT NULL DEFAULT FALSE,
  orcamento_pago BOOLEAN NOT NULL DEFAULT FALSE,
  forma_pagamento VARCHAR(30),
  parcelas INTEGER,
  orcamento_id BIGINT REFERENCES public.orcamentos(id) ON DELETE SET NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE IF EXISTS public.financeiro
  ADD COLUMN IF NOT EXISTS oculto BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE IF EXISTS public.financeiro
  ADD COLUMN IF NOT EXISTS orcamento_pago BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE IF EXISTS public.financeiro
  ADD COLUMN IF NOT EXISTS forma_pagamento VARCHAR(30);

ALTER TABLE IF EXISTS public.financeiro
  ADD COLUMN IF NOT EXISTS parcelas INTEGER;

ALTER TABLE IF EXISTS public.financeiro
  ADD COLUMN IF NOT EXISTS comissao_percentual NUMERIC(7, 2);

ALTER TABLE IF EXISTS public.financeiro
  ADD COLUMN IF NOT EXISTS comissao_valor NUMERIC(14, 2);

CREATE INDEX IF NOT EXISTS idx_financeiro_tipo ON public.financeiro (tipo);
CREATE INDEX IF NOT EXISTS idx_financeiro_data ON public.financeiro (data_lancamento DESC);
CREATE INDEX IF NOT EXISTS idx_financeiro_orcamento_id ON public.financeiro (orcamento_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_financeiro_receita_orcamento
  ON public.financeiro (orcamento_id)
  WHERE tipo = 'receita' AND orcamento_id IS NOT NULL;
