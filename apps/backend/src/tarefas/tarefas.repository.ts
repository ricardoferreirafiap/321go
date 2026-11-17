import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTarefaDto } from './dto/create-tarefa.dto';
import { UpdateTarefaDto } from './dto/update-tarefa.dto';

@Injectable()
export class TarefasRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    const prisma = this.prisma as any;
    return prisma.tarefa.findMany({
      orderBy: { criadoEm: 'desc' },
    });
  }

  findOne(id: number) {
    const prisma = this.prisma as any;
    return prisma.tarefa.findUnique({
      where: { id: BigInt(id) },
    });
  }

  create(dto: CreateTarefaDto) {
    const prisma = this.prisma as any;
    return prisma.tarefa.create({
      data: {
        titulo: dto.titulo,
        descricao: dto.descricao ?? null,
        responsavel: dto.responsavel ?? null,
        prioridade: dto.prioridade ?? 'Média',
        status: dto.status ?? 'Pendente',
        prazo: dto.prazo ? new Date(dto.prazo) : null,
        categoria: dto.categoria ?? null,
      },
    });
  }

  update(id: number, dto: UpdateTarefaDto) {
    const prisma = this.prisma as any;
    return prisma.tarefa.update({
      where: { id: BigInt(id) },
      data: {
        titulo: dto.titulo ?? undefined,
        descricao: dto.descricao ?? undefined,
        responsavel: dto.responsavel ?? undefined,
        prioridade: dto.prioridade ?? undefined,
        status: dto.status ?? undefined,
        prazo: dto.prazo ? new Date(dto.prazo) : undefined,
        categoria: dto.categoria ?? undefined,
      },
    });
  }

  remove(id: number) {
    const prisma = this.prisma as any;
    return prisma.tarefa.delete({
      where: { id: BigInt(id) },
    });
  }
}