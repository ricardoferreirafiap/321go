import { Injectable, NotFoundException } from '@nestjs/common';
import { ProdutosRepository } from './produtos.repository';
import { CreateProdutoDto } from './dto/create-produto.dto';
import { UpdateProdutoDto } from './dto/update-produto.dto';

export type ProdutoResponseDto = {
  id: number;
  nome: string;
  codigo: string | null;
  categoria: string | null;
  preco: number;
  fornecedor: string | null;
  operadora: string | null;
  unidade: string;
  status: 'Ativo' | 'Inativo';
  criadoEm: string;
  atualizadoEm: string;
};

@Injectable()
export class ProdutosService {
  constructor(private readonly produtosRepository: ProdutosRepository) {}

  private toResponse(item: any): ProdutoResponseDto {
    return {
      id: Number(item.id),
      nome: item.nome,
      codigo: item.codigo ?? null,
      categoria: item.categoria ?? null,
      preco: Number(item.preco),
      fornecedor: item.fornecedor ?? null,
      operadora: item.operadora ?? null,
      unidade: item.unidade ?? 'un',
      status: item.status ?? 'Ativo',
      criadoEm: new Date(item.criadoEm).toISOString(),
      atualizadoEm: new Date(item.atualizadoEm).toISOString(),
    };
  }

  async findAll() {
    const itens: any[] = await this.produtosRepository.findAll();
    return itens.map((item: any) => this.toResponse(item));
  }

  async findOne(id: number) {
    const item = await this.produtosRepository.findOne(id);
    if (!item) {
      throw new NotFoundException('Produto não encontrado');
    }
    return this.toResponse(item);
  }

  async create(dto: CreateProdutoDto) {
    const item = await this.produtosRepository.create(dto);
    return this.toResponse(item);
  }

  async update(id: number, dto: UpdateProdutoDto) {
    const existing = await this.produtosRepository.findOne(id);
    if (!existing) {
      throw new NotFoundException('Produto não encontrado');
    }

    const item = await this.produtosRepository.update(id, dto);
    return this.toResponse(item);
  }

  async remove(id: number) {
    const existing = await this.produtosRepository.findOne(id);
    if (!existing) {
      throw new NotFoundException('Produto não encontrado');
    }

    await this.produtosRepository.remove(id);
    return { deleted: true, id };
  }
}