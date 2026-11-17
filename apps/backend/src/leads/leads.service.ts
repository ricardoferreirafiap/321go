import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { LeadsRepository } from './leads.repository';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';

export type LeadResponseDto = {
  id: number;
  nome: string;
  email: string | null;
  whatsapp: string | null;
  status: 'Novo' | 'Em Contato' | 'Qualificado' | 'Perdido' | 'Vendido';
  statusCrm: 'Novo Lead' | 'Qualificação' | 'Reunião' | 'Follow-ups' | 'Pagos' | 'Nutrição' | 'Finalizados';
  viagens: number;
  criadoEm: string;
  atendente: string | null;
  atualizadoEm: string;
};

@Injectable()
export class LeadsService {
  constructor(private readonly leadsRepository: LeadsRepository) {}

  private formatDate(value: unknown, withTime = false): string {
    if (!value) {
      return '';
    }

    const parsed = new Date(value as string | number | Date);
    if (Number.isNaN(parsed.getTime())) {
      return '';
    }

    return withTime ? parsed.toISOString() : parsed.toISOString().slice(0, 10);
  }

  private isSchemaDriftError(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === 'P2021' || error.code === 'P2022')
    );
  }

  private toResponse(row: any): LeadResponseDto {
    return {
      id: Number(row.id),
      nome: String(row.nome),
      email: row.email ?? null,
      whatsapp: row.whatsapp ?? null,
      status: row.status ?? 'Novo',
      statusCrm: row.statusCrm ?? 'Novo Lead',
      viagens: Number(row.viagens ?? 0),
      criadoEm: this.formatDate(row.criadoEm),
      atendente: row.atendente ?? null,
      atualizadoEm: this.formatDate(row.atualizadoEm, true),
    };
  }

  async findAll() {
    try {
      const rows = await this.leadsRepository.findAll();
      return rows.map((row) => this.toResponse(row));
    } catch (error) {
      if (this.isSchemaDriftError(error)) {
        return [];
      }
      throw error;
    }
  }

  async findOne(id: number) {
    const item = await this.leadsRepository.findOne(id);
    if (!item) {
      throw new NotFoundException('Lead não encontrado');
    }

    return this.toResponse(item);
  }

  async create(dto: CreateLeadDto) {
    const item = await this.leadsRepository.create(dto);
    return this.toResponse(item);
  }

  async update(id: number, dto: UpdateLeadDto) {
    const existing = await this.leadsRepository.findOne(id);
    if (!existing) {
      throw new NotFoundException('Lead não encontrado');
    }

    const item = await this.leadsRepository.update(id, dto);
    return this.toResponse(item);
  }

  async remove(id: number) {
    const existing = await this.leadsRepository.findOne(id);
    if (!existing) {
      throw new NotFoundException('Lead não encontrado');
    }

    await this.leadsRepository.remove(id);
    return { deleted: true, id };
  }
}
