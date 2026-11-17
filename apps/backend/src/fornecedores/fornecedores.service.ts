import { Injectable, NotFoundException } from '@nestjs/common';
import { FornecedoresRepository } from './fornecedores.repository';
import { CreateFornecedorDto } from './dto/create-fornecedor.dto';
import { UpdateFornecedorDto } from './dto/update-fornecedor.dto';

export type FornecedorResponseDto = {
  id: number;
  razaoSocial: string;
  nomeFantasia: string | null;
  cnpj: string | null;
  email: string | null;
  telefone: string | null;
  cep: string | null;
  endereco: string | null;
  complemento: string | null;
  cidade: string | null;
  estado: string | null;
  status: 'Ativo' | 'Inativo';
  categoria: string | null;
  criadoEm: string;
  atualizadoEm: string;
};

@Injectable()
export class FornecedoresService {
  constructor(private readonly fornecedoresRepository: FornecedoresRepository) {}

  private toResponse(item: any): FornecedorResponseDto {
    return {
      id: Number(item.id),
      razaoSocial: item.razaoSocial,
      nomeFantasia: item.nomeFantasia ?? null,
      cnpj: item.cnpj ?? null,
      email: item.email ?? null,
      telefone: item.telefone ?? null,
      cep: item.cep ?? null,
      endereco: item.endereco ?? null,
      complemento: item.complemento ?? null,
      cidade: item.cidade ?? null,
      estado: item.estado ?? null,
      status: item.status ?? 'Ativo',
      categoria: item.categoria ?? null,
      criadoEm: new Date(item.criadoEm).toISOString(),
      atualizadoEm: new Date(item.atualizadoEm).toISOString(),
    };
  }

  async findAll() {
    const itens = await this.fornecedoresRepository.findAll();
    return itens.map((item) => this.toResponse(item));
  }

  async findOne(id: number) {
    const item = await this.fornecedoresRepository.findOne(id);
    if (!item) {
      throw new NotFoundException('Fornecedor não encontrado');
    }
    return this.toResponse(item);
  }

  async create(dto: CreateFornecedorDto) {
    const item = await this.fornecedoresRepository.create(dto);
    return this.toResponse(item);
  }

  async update(id: number, dto: UpdateFornecedorDto) {
    const existing = await this.fornecedoresRepository.findOne(id);
    if (!existing) {
      throw new NotFoundException('Fornecedor não encontrado');
    }

    const item = await this.fornecedoresRepository.update(id, dto);
    return this.toResponse(item);
  }

  async remove(id: number) {
    const existing = await this.fornecedoresRepository.findOne(id);
    if (!existing) {
      throw new NotFoundException('Fornecedor não encontrado');
    }

    await this.fornecedoresRepository.remove(id);
    return { deleted: true, id };
  }
}

