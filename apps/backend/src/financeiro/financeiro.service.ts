import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFinanceiroDto } from './dto/create-financeiro.dto';
import { UpdateFinanceiroDto } from './dto/update-financeiro.dto';

export type FinanceiroResponseDto = {
  id: number;
  tipo: 'receita' | 'despesa';
  descricao: string;
  valor: number;
  comissaoPercentual: number | null;
  comissaoValor: number | null;
  data: string;
  oculto: boolean;
  orcamentoPago: boolean;
  formaPagamento: string | null;
  parcelas: number | null;
  orcamentoId: number | null;
  orcamentoNumero: string | null;
  cliente: string | null;
  criadoEm: string;
  atualizadoEm: string;
};

@Injectable()
export class FinanceiroService {
  constructor(private readonly prisma: PrismaService) {}

  private toResponse(item: any): FinanceiroResponseDto {
    return {
      id: Number(item.id),
      tipo: item.tipo,
      descricao: item.descricao,
      valor: Number(item.valor),
      comissaoPercentual: item.comissaoPercentual == null ? null : Number(item.comissaoPercentual),
      comissaoValor: item.comissaoValor == null ? null : Number(item.comissaoValor),
      data: item.dataLancamento ? new Date(item.dataLancamento).toISOString().slice(0, 10) : '',
      oculto: Boolean(item.oculto),
      orcamentoPago: Boolean(item.orcamentoPago),
      formaPagamento: item.formaPagamento ?? null,
      parcelas: item.parcelas ?? null,
      orcamentoId: item.orcamentoId == null ? null : Number(item.orcamentoId),
      orcamentoNumero: item.orcamentoNumero ?? null,
      cliente: item.clienteNome ?? null,
      criadoEm: new Date(item.criadoEm).toISOString(),
      atualizadoEm: new Date(item.atualizadoEm).toISOString(),
    };
  }

  async findAll() {
    const itens = await this.prisma.financeiro.findMany({
      orderBy: { criadoEm: 'desc' },
    });

    return itens.map((item) => this.toResponse(item));
  }

  async findOne(id: number) {
    const item = await this.prisma.financeiro.findUnique({ where: { id: BigInt(id) } });
    if (!item) {
      throw new NotFoundException('Financeiro não encontrado');
    }
    return this.toResponse(item);
  }

  create(dto: CreateFinanceiroDto) {
    return this.prisma.financeiro.create({
      data: {
        tipo: dto.tipo,
        descricao: dto.descricao,
        valor: dto.valor,
        comissaoPercentual: dto.comissaoPercentual ?? null,
        comissaoValor: dto.comissaoValor ?? null,
        dataLancamento: new Date(dto.data),
        oculto: dto.oculto ?? false,
        orcamentoPago: dto.orcamentoPago ?? false,
        formaPagamento: dto.formaPagamento ?? null,
        parcelas: dto.parcelas ?? null,
        orcamentoId: dto.orcamentoId ? BigInt(dto.orcamentoId) : null,
        orcamentoNumero: dto.orcamentoNumero ?? null,
        clienteNome: dto.cliente ?? null,
      },
    }).then((item) => this.toResponse(item));
  }

  async update(id: number, dto: UpdateFinanceiroDto) {
    const item = await this.prisma.financeiro.findUnique({ where: { id: BigInt(id) } });
    if (!item) {
      throw new NotFoundException('Financeiro não encontrado');
    }

    const updated = await this.prisma.financeiro.update({
      where: { id: BigInt(id) },
      data: {
        tipo: dto.tipo,
        descricao: dto.descricao,
        valor: dto.valor,
        comissaoPercentual: dto.comissaoPercentual ?? null,
        comissaoValor: dto.comissaoValor ?? null,
        dataLancamento: dto.data ? new Date(dto.data) : item.dataLancamento,
        oculto: dto.oculto ?? item.oculto,
        orcamentoPago: dto.orcamentoPago ?? item.orcamentoPago,
        formaPagamento: dto.formaPagamento ?? item.formaPagamento,
        parcelas: dto.parcelas ?? item.parcelas,
        orcamentoId: dto.orcamentoId ? BigInt(dto.orcamentoId) : item.orcamentoId,
        orcamentoNumero: dto.orcamentoNumero ?? item.orcamentoNumero,
        clienteNome: dto.cliente ?? item.clienteNome,
      },
    });

    return this.toResponse(updated);
  }

  async remove(id: number) {
    const item = await this.prisma.financeiro.findUnique({ where: { id: BigInt(id) } });
    if (!item) {
      throw new NotFoundException('Financeiro não encontrado');
    }

    await this.prisma.financeiro.delete({ where: { id: BigInt(id) } });
    return { deleted: true };
  }
}
