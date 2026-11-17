import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrcamentoDto } from './dto/create-orcamento.dto';
import { UpdateOrcamentoDto } from './dto/update-orcamento.dto';

@Injectable()
export class OrcamentosRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toJsonCreateValue(value: unknown) {
    return (value ?? []) as Prisma.InputJsonValue;
  }

  private toJsonUpdateValue(value: unknown) {
    if (value === undefined) {
      return undefined;
    }
    return value as Prisma.InputJsonValue;
  }

  findAll() {
    return this.prisma.orcamento.findMany({
      orderBy: { criadoEm: 'desc' },
    });
  }

  findOne(id: number) {
    return this.prisma.orcamento.findUnique({
      where: { id: BigInt(id) },
    });
  }

  findByNumero(numero: string) {
    return this.prisma.orcamento.findUnique({
      where: { numero },
    });
  }

  findByPublicToken(publicToken: string) {
    return this.prisma.orcamento.findFirst({
      where: { publicToken },
    });
  }

  create(dto: CreateOrcamentoDto) {
    return this.prisma.orcamento.create({
      data: {
        numero: dto.numero,
        cliente: dto.cliente,
        email: dto.email ?? null,
        destino: dto.destino ?? null,
        agenteViagem: dto.agenteViagem ?? null,
        status: dto.status ?? 'Rascunho',
        statusViagem: dto.statusViagem ?? null,
        dataCriacao: dto.dataCriacao ? new Date(dto.dataCriacao) : null,
        dataValidade: dto.dataValidade ? new Date(dto.dataValidade) : null,
        observacoes: dto.observacoes ?? null,
        itens: this.toJsonCreateValue(dto.itens),
        pacotes: this.toJsonCreateValue(dto.pacotes),
        voos: this.toJsonCreateValue(dto.voos),
        hospedagem: this.toJsonCreateValue(dto.hospedagem),
        roteiro: dto.roteiro ?? null,
        promptRoteiroIa: dto.promptRoteiroIA ?? null,
        dayByDay: this.toJsonCreateValue(dto.dayByDay),
        transporte: this.toJsonCreateValue(dto.transporte),
        restaurante: this.toJsonCreateValue(dto.restaurante),
        experiencias: this.toJsonCreateValue(dto.experiencias),
        seguro: this.toJsonCreateValue(dto.seguro),
        promptPerfilIa: dto.promptPerfilViagemIA ?? null,
        publicToken: dto.publicToken ?? null,
      },
    });
  }

  update(id: number, dto: UpdateOrcamentoDto) {
    return this.prisma.orcamento.update({
      where: { id: BigInt(id) },
      data: {
        numero: dto.numero ?? undefined,
        cliente: dto.cliente ?? undefined,
        email: dto.email ?? undefined,
        destino: dto.destino ?? undefined,
        agenteViagem: dto.agenteViagem ?? undefined,
        status: dto.status ?? undefined,
        statusViagem: dto.statusViagem ?? undefined,
        dataCriacao: dto.dataCriacao ? new Date(dto.dataCriacao) : undefined,
        dataValidade: dto.dataValidade ? new Date(dto.dataValidade) : undefined,
        observacoes: dto.observacoes ?? undefined,
        itens: this.toJsonUpdateValue(dto.itens),
        pacotes: this.toJsonUpdateValue(dto.pacotes),
        voos: this.toJsonUpdateValue(dto.voos),
        hospedagem: this.toJsonUpdateValue(dto.hospedagem),
        roteiro: dto.roteiro ?? undefined,
        promptRoteiroIa: dto.promptRoteiroIA ?? undefined,
        dayByDay: this.toJsonUpdateValue(dto.dayByDay),
        transporte: this.toJsonUpdateValue(dto.transporte),
        restaurante: this.toJsonUpdateValue(dto.restaurante),
        experiencias: this.toJsonUpdateValue(dto.experiencias),
        seguro: this.toJsonUpdateValue(dto.seguro),
        promptPerfilIa: dto.promptPerfilViagemIA ?? undefined,
        publicToken: dto.publicToken ?? undefined,
      },
    });
  }

  async remove(id: number) {
    const item = await this.findOne(id);
    if (!item) {
      return null;
    }

    await this.prisma.orcamento.delete({
      where: { id: BigInt(id) },
    });

    return item;
  }
}

