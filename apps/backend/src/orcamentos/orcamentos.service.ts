import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { OrcamentosRepository } from './orcamentos.repository';
import { CreateOrcamentoDto } from './dto/create-orcamento.dto';
import { UpdateOrcamentoDto } from './dto/update-orcamento.dto';

type OrcamentoResponseDto = {
  id: number;
  numero: string;
  publicToken?: string;
  cliente: string;
  email: string;
  perfilViagem: string[];
  promptPerfilViagemIA: string;
  promptRoteiroIA: string;
  passageiros: string[];
  formaPagamento: string;
  parcelas: number | null;
  destino: string;
  agenteViagem: string;
  status: string;
  statusViagem: string;
  dataCriacao: string;
  dataValidade: string;
  itens: unknown[];
  pacotes: unknown[];
  voos: unknown[];
  hospedagem: unknown[];
  roteiro: string;
  dayByDay: unknown[];
  transporte: unknown[];
  restaurante: unknown[];
  experiencias: unknown[];
  seguro: unknown[];
  observacoes: string;
};

@Injectable()
export class OrcamentosService {
  constructor(private readonly orcamentosRepository: OrcamentosRepository) {}

  private toResponse(item: any): OrcamentoResponseDto {
    return {
      id: Number(item.id),
      numero: item.numero ?? '',
      publicToken: item.publicToken ?? undefined,
      cliente: item.cliente ?? '',
      email: item.email ?? '',
      perfilViagem: [],
      promptPerfilViagemIA: item.promptPerfilIa ?? '',
      promptRoteiroIA: item.promptRoteiroIa ?? '',
      passageiros: [],
      formaPagamento: '',
      parcelas: null,
      destino: item.destino ?? '',
      agenteViagem: item.agenteViagem ?? '',
      status: item.status ?? 'Rascunho',
      statusViagem: item.statusViagem ?? 'Não Iniciada',
      dataCriacao: item.dataCriacao
        ? new Date(item.dataCriacao).toISOString().slice(0, 10)
        : new Date(item.criadoEm).toISOString().slice(0, 10),
      dataValidade: item.dataValidade
        ? new Date(item.dataValidade).toISOString().slice(0, 10)
        : '',
      itens: Array.isArray(item.itens) ? item.itens : [],
      pacotes: Array.isArray(item.pacotes) ? item.pacotes : [],
      voos: Array.isArray(item.voos) ? item.voos : [],
      hospedagem: Array.isArray(item.hospedagem) ? item.hospedagem : [],
      roteiro: item.roteiro ?? '',
      dayByDay: Array.isArray(item.dayByDay) ? item.dayByDay : [],
      transporte: Array.isArray(item.transporte) ? item.transporte : [],
      restaurante: Array.isArray(item.restaurante) ? item.restaurante : [],
      experiencias: Array.isArray(item.experiencias) ? item.experiencias : [],
      seguro: Array.isArray(item.seguro) ? item.seguro : [],
      observacoes: item.observacoes ?? '',
    };
  }

  async findAll() {
    const itens = await this.orcamentosRepository.findAll();
    return itens.map((item) => this.toResponse(item));
  }

  async findOne(id: number) {
    const item = await this.orcamentosRepository.findOne(id);
    if (!item) {
      throw new NotFoundException('Orçamento não encontrado');
    }

    return this.toResponse(item);
  }

  async findByNumero(numero: string) {
    const item = await this.orcamentosRepository.findByNumero(String(numero || '').trim());
    if (!item) {
      throw new NotFoundException('Orçamento não encontrado');
    }

    return this.toResponse(item);
  }

  async findByPublicToken(publicToken: string) {
    const item = await this.orcamentosRepository.findByPublicToken(String(publicToken || '').trim());
    if (!item) {
      throw new NotFoundException('Orçamento não encontrado');
    }

    return this.toResponse(item);
  }

  async create(dto: CreateOrcamentoDto) {
    const payload: CreateOrcamentoDto = {
      ...dto,
      numero: dto.numero?.trim(),
      cliente: dto.cliente?.trim(),
      email: dto.email?.trim() || undefined,
      destino: dto.destino?.trim() || undefined,
      agenteViagem: dto.agenteViagem?.trim() || undefined,
      status: dto.status?.trim() || undefined,
      statusViagem: dto.statusViagem?.trim() || undefined,
      observacoes: dto.observacoes?.trim() || undefined,
      roteiro: dto.roteiro?.trim() || undefined,
      promptPerfilViagemIA: dto.promptPerfilViagemIA?.trim() || undefined,
      promptRoteiroIA: dto.promptRoteiroIA?.trim() || undefined,
      publicToken: dto.publicToken?.trim() || undefined,
    };

    try {
      const created = await this.orcamentosRepository.create(payload);
      return this.toResponse(created);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Já existe um orçamento com este número/token.');
      }
      throw error;
    }
  }

  async update(id: number, dto: UpdateOrcamentoDto) {
    const exists = await this.orcamentosRepository.findOne(id);
    if (!exists) {
      throw new NotFoundException('Orçamento não encontrado');
    }

    const payload: UpdateOrcamentoDto = {
      ...dto,
      numero: dto.numero?.trim(),
      cliente: dto.cliente?.trim(),
      email: dto.email?.trim() || undefined,
      destino: dto.destino?.trim() || undefined,
      agenteViagem: dto.agenteViagem?.trim() || undefined,
      status: dto.status?.trim() || undefined,
      statusViagem: dto.statusViagem?.trim() || undefined,
      observacoes: dto.observacoes?.trim() || undefined,
      roteiro: dto.roteiro?.trim() || undefined,
      promptPerfilViagemIA: dto.promptPerfilViagemIA?.trim() || undefined,
      promptRoteiroIA: dto.promptRoteiroIA?.trim() || undefined,
      publicToken: dto.publicToken?.trim() || undefined,
    };

    try {
      const updated = await this.orcamentosRepository.update(id, payload);
      return this.toResponse(updated);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Já existe um orçamento com este número/token.');
      }
      throw error;
    }
  }

  async remove(id: number) {
    const removed = await this.orcamentosRepository.remove(id);
    if (!removed) {
      throw new NotFoundException('Orçamento não encontrado');
    }

    return { deleted: true, id: Number(removed.id) };
  }
}

