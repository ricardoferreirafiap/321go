import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFuncionarioDto } from './dto/create-funcionario.dto';
import { UpdateFuncionarioDto } from './dto/update-funcionario.dto';

@Injectable()
export class FuncionariosRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    const prisma = this.prisma as any;
    return prisma.funcionario.findMany({
      orderBy: { criadoEm: 'desc' },
    });
  }

  findOne(id: number) {
    const prisma = this.prisma as any;
    return prisma.funcionario.findUnique({
      where: { id: BigInt(id) },
    });
  }

  findByEmail(email: string) {
    const prisma = this.prisma as any;
    return prisma.funcionario.findFirst({
      where: { email: email.trim().toLowerCase() },
    });
  }

  create(dto: CreateFuncionarioDto) {
    const prisma = this.prisma as any;
    return prisma.funcionario.create({
      data: {
        nome: dto.name,
        email: dto.email,
        senhaHash: dto.password ? dto.password : null,
        cargo: dto.role ?? null,
        departamento: dto.department ?? null,
        status: dto.status ?? 'Ativo',
        nivelAcesso: dto.accessLevel ?? 'Agente',
        fotoUrl: dto.photo ?? null,
        saudacoes: dto.saudacoes ?? null,
        iniciais: dto.initials ?? null,
      },
    });
  }

  update(id: number, dto: UpdateFuncionarioDto) {
    const prisma = this.prisma as any;
    return prisma.funcionario.update({
      where: { id: BigInt(id) },
      data: {
        nome: dto.name ?? undefined,
        email: dto.email ?? undefined,
        senhaHash: dto.password !== undefined ? (dto.password || null) : undefined,
        cargo: dto.role ?? undefined,
        departamento: dto.department ?? undefined,
        status: dto.status ?? undefined,
        nivelAcesso: dto.accessLevel ?? undefined,
        fotoUrl: dto.photo ?? undefined,
        saudacoes: dto.saudacoes ?? undefined,
        iniciais: dto.initials ?? undefined,
      },
    });
  }

  remove(id: number) {
    const prisma = this.prisma as any;
    return prisma.funcionario.delete({
      where: { id: BigInt(id) },
    });
  }
}