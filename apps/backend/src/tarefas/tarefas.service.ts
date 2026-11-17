import { Injectable, NotFoundException } from '@nestjs/common';
import { TarefasRepository } from './tarefas.repository';
import { CreateTarefaDto } from './dto/create-tarefa.dto';
import { UpdateTarefaDto } from './dto/update-tarefa.dto';

export type TarefaResponseDto = {
  id: number;
  titulo: string;
  descricao: string | null;
  responsavel: string | null;
  prioridade: 'Alta' | 'Média' | 'Baixa';
  status: 'Pendente' | 'Em andamento' | 'Concluída' | 'Cancelada';
  prazo: string | null;
  categoria: string | null;
  criadoEm: string;
  atualizadoEm: string;
};

@Injectable()
export class TarefasService {
  constructor(private readonly tarefasRepository: TarefasRepository) {}

  private toResponse(item: any): TarefaResponseDto {
    return {
      id: Number(item.id),
      titulo: item.titulo,
      descricao: item.descricao ?? null,
      responsavel: item.responsavel ?? null,
      prioridade: item.prioridade ?? 'Média',
      status: item.status ?? 'Pendente',
      prazo: item.prazo ? new Date(item.prazo).toISOString().slice(0, 10) : null,
      categoria: item.categoria ?? null,
      criadoEm: new Date(item.criadoEm).toISOString(),
      atualizadoEm: new Date(item.atualizadoEm).toISOString(),
    };
  }

  async findAll() {
    const itens: any[] = await this.tarefasRepository.findAll();
    return itens.map((item: any) => this.toResponse(item));
  }

  async findOne(id: number) {
    const item = await this.tarefasRepository.findOne(id);
    if (!item) {
      throw new NotFoundException('Tarefa não encontrada');
    }
    return this.toResponse(item);
  }

  async create(dto: CreateTarefaDto) {
    const item = await this.tarefasRepository.create(dto);
    return this.toResponse(item);
  }

  async update(id: number, dto: UpdateTarefaDto) {
    const existing = await this.tarefasRepository.findOne(id);
    if (!existing) {
      throw new NotFoundException('Tarefa não encontrada');
    }

    const item = await this.tarefasRepository.update(id, dto);
    return this.toResponse(item);
  }

  async remove(id: number) {
    const existing = await this.tarefasRepository.findOne(id);
    if (!existing) {
      throw new NotFoundException('Tarefa não encontrada');
    }

    await this.tarefasRepository.remove(id);
    return { deleted: true, id };
  }
}