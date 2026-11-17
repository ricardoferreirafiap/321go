import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';

@Injectable()
export class LeadsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.lead.findMany({
      orderBy: { criadoEm: 'desc' },
    });
  }

  findOne(id: number) {
    return this.prisma.lead.findUnique({
      where: { id: BigInt(id) },
    });
  }

  create(dto: CreateLeadDto) {
    return this.prisma.lead.create({
      data: {
        nome: dto.nome,
        email: dto.email ?? null,
        whatsapp: dto.whatsapp ?? null,
        status: dto.status ?? 'Novo',
        statusCrm: dto.statusCrm ?? 'Novo Lead',
        viagens: dto.viagens ?? 0,
        criadoEm: dto.criadoEm ? new Date(dto.criadoEm) : new Date(),
        atendente: dto.atendente ?? null,
      },
    });
  }

  update(id: number, dto: UpdateLeadDto) {
    return this.prisma.lead.update({
      where: { id: BigInt(id) },
      data: {
        nome: dto.nome ?? undefined,
        email: dto.email ?? undefined,
        whatsapp: dto.whatsapp ?? undefined,
        status: dto.status ?? undefined,
        statusCrm: dto.statusCrm ?? undefined,
        viagens: dto.viagens ?? undefined,
        criadoEm: dto.criadoEm ? new Date(dto.criadoEm) : undefined,
        atendente: dto.atendente ?? undefined,
      },
    });
  }

  remove(id: number) {
    return this.prisma.lead.delete({
      where: { id: BigInt(id) },
    });
  }
}
