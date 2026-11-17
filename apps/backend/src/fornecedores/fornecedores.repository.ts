import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFornecedorDto } from './dto/create-fornecedor.dto';
import { UpdateFornecedorDto } from './dto/update-fornecedor.dto';

@Injectable()
export class FornecedoresRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.fornecedor.findMany({
      orderBy: { criadoEm: 'desc' },
    });
  }

  findOne(id: number) {
    return this.prisma.fornecedor.findUnique({
      where: { id: BigInt(id) },
    });
  }

  create(dto: CreateFornecedorDto) {
    return this.prisma.fornecedor.create({
      data: {
        razaoSocial: dto.razaoSocial,
        nomeFantasia: dto.nomeFantasia ?? null,
        cnpj: dto.cnpj ?? null,
        email: dto.email ?? null,
        telefone: dto.telefone ?? null,
        cep: dto.cep ?? null,
        endereco: dto.endereco ?? null,
        complemento: dto.complemento ?? null,
        cidade: dto.cidade ?? null,
        estado: dto.estado ?? null,
        status: dto.status ?? 'Ativo',
        categoria: dto.categoria ?? null,
      },
    });
  }

  update(id: number, dto: UpdateFornecedorDto) {
    return this.prisma.fornecedor.update({
      where: { id: BigInt(id) },
      data: {
        razaoSocial: dto.razaoSocial ?? undefined,
        nomeFantasia: dto.nomeFantasia ?? undefined,
        cnpj: dto.cnpj ?? undefined,
        email: dto.email ?? undefined,
        telefone: dto.telefone ?? undefined,
        cep: dto.cep ?? undefined,
        endereco: dto.endereco ?? undefined,
        complemento: dto.complemento ?? undefined,
        cidade: dto.cidade ?? undefined,
        estado: dto.estado ?? undefined,
        status: dto.status ?? undefined,
        categoria: dto.categoria ?? undefined,
      },
    });
  }

  remove(id: number) {
    return this.prisma.fornecedor.delete({
      where: { id: BigInt(id) },
    });
  }
}

