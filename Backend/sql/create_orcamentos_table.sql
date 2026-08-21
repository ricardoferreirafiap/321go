CREATE TABLE IF NOT EXISTS public.orcamentos (
  id BIGSERIAL PRIMARY KEY,
  numero VARCHAR(20) NOT NULL UNIQUE,
  cliente VARCHAR(150) NOT NULL,
  email VARCHAR(255),
  destino VARCHAR(255),
  agente_viagem VARCHAR(150),
  status VARCHAR(20) NOT NULL DEFAULT 'Rascunho' CHECK (status IN ('Rascunho', 'Enviado', 'Aprovado', 'Rejeitado', 'Cancelado')),
  status_viagem VARCHAR(20) CHECK (status_viagem IN ('Não Iniciada', 'Em Andamento', 'Finalizada')),
  data_criacao DATE,
  data_validade DATE,
  observacoes TEXT,
  itens JSONB NOT NULL DEFAULT '[]'::jsonb,
  pacotes JSONB NOT NULL DEFAULT '[]'::jsonb,
  voos JSONB NOT NULL DEFAULT '[]'::jsonb,
  hospedagem JSONB NOT NULL DEFAULT '[]'::jsonb,
  roteiro TEXT,
  prompt_roteiro_ia TEXT,
  day_by_day JSONB NOT NULL DEFAULT '[]'::jsonb,
  transporte JSONB NOT NULL DEFAULT '[]'::jsonb,
  restaurante JSONB NOT NULL DEFAULT '[]'::jsonb,
  experiencias JSONB NOT NULL DEFAULT '[]'::jsonb,
  seguro JSONB NOT NULL DEFAULT '[]'::jsonb,
  prompt_perfil_ia TEXT,
  public_token VARCHAR(36) NOT NULL UNIQUE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.orcamentos
ADD COLUMN IF NOT EXISTS destino VARCHAR(255);

ALTER TABLE public.orcamentos
ADD COLUMN IF NOT EXISTS public_token VARCHAR(36);

ALTER TABLE public.orcamentos
ADD COLUMN IF NOT EXISTS prompt_perfil_ia TEXT;

ALTER TABLE public.orcamentos
ADD COLUMN IF NOT EXISTS prompt_roteiro_ia TEXT;

ALTER TABLE public.orcamentos
ADD COLUMN IF NOT EXISTS status_viagem VARCHAR(20) CHECK (status_viagem IN ('Não Iniciada', 'Em Andamento', 'Finalizada'));

CREATE INDEX IF NOT EXISTS idx_orcamentos_cliente ON public.orcamentos (cliente);
CREATE INDEX IF NOT EXISTS idx_orcamentos_status ON public.orcamentos (status);
CREATE INDEX IF NOT EXISTS idx_orcamentos_data_criacao ON public.orcamentos (data_criacao);
