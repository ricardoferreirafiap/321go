-- CreateTable
CREATE TABLE "financeiro" (
    "id" BIGSERIAL NOT NULL,
    "tipo" VARCHAR(10) NOT NULL,
    "descricao" VARCHAR(255) NOT NULL,
    "valor" DECIMAL(14,2) NOT NULL,
    "comissao_percentual" DECIMAL(7,2),
    "comissao_valor" DECIMAL(14,2),
    "data_lancamento" DATE NOT NULL,
    "oculto" BOOLEAN NOT NULL DEFAULT false,
    "orcamento_pago" BOOLEAN NOT NULL DEFAULT false,
    "forma_pagamento" VARCHAR(30),
    "parcelas" INTEGER,
    "orcamento_id" BIGINT,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "financeiro_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_financeiro_tipo" ON "financeiro"("tipo");

-- CreateIndex
CREATE INDEX "idx_financeiro_data" ON "financeiro"("data_lancamento" DESC);

-- CreateIndex
CREATE INDEX "idx_financeiro_orcamento_id" ON "financeiro"("orcamento_id");

-- AddForeignKey
ALTER TABLE "financeiro" ADD CONSTRAINT "financeiro_orcamento_id_fkey" FOREIGN KEY ("orcamento_id") REFERENCES "orcamentos"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
