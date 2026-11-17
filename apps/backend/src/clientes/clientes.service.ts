import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ClientesRepository } from './clientes.repository';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';

export type ClienteResponseDto = {
  id: number;
  nome: string | null;
  sobrenome: string | null;
  nomeCompleto: string | null;
  email: string | null;
  telefone: string | null;
  cep: string | null;
  endereco: string | null;
  numero: string | null;
  complemento: string | null;
  cidade: string | null;
  estado: string | null;
  status: 'Ativo' | 'Inativo';
  cpfCnpj: string | null;
  rg: string | null;
  dataNascimento: string | null;
  documentoNome: string | null;
  criadoEm: string;
  atualizadoEm: string;
};

@Injectable()
export class ClientesService {
  constructor(private readonly clientesRepository: ClientesRepository) {}

  private toResponse(cliente: any): ClienteResponseDto {
    const nomeCompleto =
      cliente.nomeCompleto ??
      (([cliente.nome, cliente.sobrenome].filter(Boolean).join(' ') || null) as string | null);

    return {
      id: Number(cliente.id),
      nome: cliente.nome ?? null,
      sobrenome: cliente.sobrenome ?? null,
      nomeCompleto,
      email: cliente.email ?? null,
      telefone: cliente.telefone ?? null,
      cep: cliente.cep ?? null,
      endereco: cliente.endereco ?? null,
      numero: cliente.numero ?? null,
      complemento: cliente.complemento ?? null,
      cidade: cliente.cidade ?? null,
      estado: cliente.estado ?? null,
      status: cliente.status ?? 'Ativo',
      cpfCnpj: cliente.cpfCnpj ?? null,
      rg: cliente.rg ?? null,
      dataNascimento: cliente.dataNascimento ? new Date(cliente.dataNascimento).toISOString() : null,
      documentoNome: cliente.documentoNome ?? null,
      criadoEm: new Date(cliente.criadoEm).toISOString(),
      atualizadoEm: new Date(cliente.atualizadoEm).toISOString(),
    };
  }

  async findAll() {
    const clientes = await this.clientesRepository.findAll();
    return clientes.map((cliente) => this.toResponse(cliente));
  }

  async findOne(id: number) {
    const cliente = await this.clientesRepository.findOne(id);
    if (!cliente) {
      throw new NotFoundException('Cliente não encontrado');
    }

    return this.toResponse(cliente);
  }

  async create(dto: CreateClienteDto) {
    const payload = {
      ...dto,
      nome: dto.nome?.trim(),
      sobrenome: dto.sobrenome?.trim() ?? null,
      nomeCompleto: dto.nomeCompleto?.trim() || null,
      email: dto.email?.trim() || null,
      telefone: dto.telefone?.trim() || null,
      cep: dto.cep?.trim() || null,
      endereco: dto.endereco?.trim() || null,
      numero: dto.numero?.trim() || null,
      complemento: dto.complemento?.trim() || null,
      cidade: dto.cidade?.trim() || null,
      estado: dto.estado?.trim().toUpperCase() || null,
      cpfCnpj: dto.cpfCnpj?.trim() || null,
      rg: dto.rg?.trim() || null,
      documentoNome: dto.documentoNome?.trim() || null,
    };

    try {
      const cliente = await this.clientesRepository.create(payload);
      return this.toResponse(cliente);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Já existe um cliente com este CPF/CNPJ.');
      }
      throw error;
    }
  }

  async update(id: number, dto: UpdateClienteDto) {
    const exists = await this.clientesRepository.findOne(id);
    if (!exists) {
      throw new NotFoundException('Cliente não encontrado');
    }

    const payload = {
      ...dto,
      nome: dto.nome?.trim(),
      sobrenome: dto.sobrenome?.trim() ?? undefined,
      nomeCompleto: dto.nomeCompleto?.trim() || undefined,
      email: dto.email?.trim() || undefined,
      telefone: dto.telefone?.trim() || undefined,
      cep: dto.cep?.trim() || undefined,
      endereco: dto.endereco?.trim() || undefined,
      numero: dto.numero?.trim() || undefined,
      complemento: dto.complemento?.trim() || undefined,
      cidade: dto.cidade?.trim() || undefined,
      estado: dto.estado?.trim().toUpperCase() || undefined,
      cpfCnpj: dto.cpfCnpj?.trim() || undefined,
      rg: dto.rg?.trim() || undefined,
      documentoNome: dto.documentoNome?.trim() || undefined,
    };

    try {
      const cliente = await this.clientesRepository.update(id, payload);
      return this.toResponse(cliente);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Já existe um cliente com este CPF/CNPJ.');
      }
      throw error;
    }
  }

  async remove(id: number) {
    const cliente = await this.clientesRepository.remove(id);
    if (!cliente) {
      throw new NotFoundException('Cliente não encontrado');
    }

    return { deleted: true, id: Number(cliente.id) };
  }
}
