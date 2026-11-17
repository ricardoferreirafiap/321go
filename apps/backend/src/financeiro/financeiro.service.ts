import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFinanceiroDto } from './dto/create-financeiro.dto';
import { UpdateFinanceiroDto } from './dto/update-financeiro.dto';

@Injectable()
export class FinanceiroService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.financeiro.findMany({
      orderBy: { criadoEm: 'desc' },
    });
  }

  async findOne(id: number) {
    const item = await this.prisma.financeiro.findUnique({ where: { id: BigInt(id) } });
    if (!item) {
      throw new NotFoundException('Financeiro não encontrado');
    }
    return item;
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
    });
  }

  async update(id: number, dto: UpdateFinanceiroDto) {
    const item = await this.prisma.financeiro.findUnique({ where: { id: BigInt(id) } });
    if (!item) {
      throw new NotFoundException('Financeiro não encontrado');
    }

    return this.prisma.financeiro.update({
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

