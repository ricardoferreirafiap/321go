import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';

@Injectable()
export class ClientesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.cliente.findMany({
      orderBy: { criadoEm: 'desc' },
    });
  }

  findOne(id: number) {
    return this.prisma.cliente.findUnique({
      where: { id: BigInt(id) },
    });
  }

  create(dto: CreateClienteDto) {
    return this.prisma.cliente.create({
      data: {
        nome: dto.nome ?? null,
        sobrenome: dto.sobrenome ?? null,
        nomeCompleto: dto.nomeCompleto ?? null,
        email: dto.email ?? null,
        telefone: dto.telefone ?? null,
        cep: dto.cep ?? null,
        endereco: dto.endereco ?? null,
        numero: dto.numero ?? null,
        complemento: dto.complemento ?? null,
        cidade: dto.cidade ?? null,
        estado: dto.estado ?? null,
        status: dto.status ?? 'Ativo',
        cpfCnpj: dto.cpfCnpj ?? null,
        rg: dto.rg ?? null,
        dataNascimento: dto.dataNascimento ? new Date(dto.dataNascimento) : null,
        documentoNome: dto.documentoNome ?? null,
      },
    });
  }

  update(id: number, dto: UpdateClienteDto) {
    return this.prisma.cliente.update({
      where: { id: BigInt(id) },
      data: {
        nome: dto.nome ?? undefined,
        sobrenome: dto.sobrenome ?? undefined,
        nomeCompleto: dto.nomeCompleto ?? undefined,
        email: dto.email ?? undefined,
        telefone: dto.telefone ?? undefined,
        cep: dto.cep ?? undefined,
        endereco: dto.endereco ?? undefined,
        numero: dto.numero ?? undefined,
        complemento: dto.complemento ?? undefined,
        cidade: dto.cidade ?? undefined,
        estado: dto.estado ?? undefined,
        status: dto.status ?? undefined,
        cpfCnpj: dto.cpfCnpj ?? undefined,
        rg: dto.rg ?? undefined,
        dataNascimento: dto.dataNascimento ? new Date(dto.dataNascimento) : undefined,
        documentoNome: dto.documentoNome ?? undefined,
      },
    });
  }

  async remove(id: number) {
    const item = await this.findOne(id);
    if (!item) {
      return null;
    }

    await this.prisma.cliente.delete({
      where: { id: BigInt(id) },
    });

    return item;
  }
}

