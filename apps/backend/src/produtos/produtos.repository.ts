import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProdutoDto } from './dto/create-produto.dto';
import { UpdateProdutoDto } from './dto/update-produto.dto';

@Injectable()
export class ProdutosRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    const prisma = this.prisma as any;
    return prisma.produto.findMany({
      orderBy: { criadoEm: 'desc' },
    });
  }

  findOne(id: number) {
    const prisma = this.prisma as any;
    return prisma.produto.findUnique({
      where: { id: BigInt(id) },
    });
  }

  create(dto: CreateProdutoDto) {
    const prisma = this.prisma as any;
    return prisma.produto.create({
      data: {
        nome: dto.nome,
        codigo: dto.codigo ?? null,
        categoria: dto.categoria ?? null,
        preco: dto.preco,
        fornecedor: dto.fornecedor ?? null,
        operadora: dto.operadora ?? null,
        unidade: dto.unidade ?? 'un',
        status: dto.status ?? 'Ativo',
      },
    });
  }

  update(id: number, dto: UpdateProdutoDto) {
    const prisma = this.prisma as any;
    return prisma.produto.update({
      where: { id: BigInt(id) },
      data: {
        nome: dto.nome ?? undefined,
        codigo: dto.codigo ?? undefined,
        categoria: dto.categoria ?? undefined,
        preco: dto.preco ?? undefined,
        fornecedor: dto.fornecedor ?? undefined,
        operadora: dto.operadora ?? undefined,
        unidade: dto.unidade ?? undefined,
        status: dto.status ?? undefined,
      },
    });
  }

  remove(id: number) {
    const prisma = this.prisma as any;
    return prisma.produto.delete({
      where: { id: BigInt(id) },
    });
  }
}