import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CountsService {
  constructor(private readonly prisma: PrismaService) {}

  async getCounts() {
    const prisma = this.prisma as any;

    const [clientes, fornecedores, produtos, tarefas, funcionarios] = await Promise.all([
      prisma.cliente.count().catch(() => 0),
      prisma.fornecedor.count().catch(() => 0),
      prisma.produto.count().catch(() => 0),
      prisma.tarefa.count().catch(() => 0),
      prisma.funcionario.count().catch(() => 0),
    ]);

    return {
      clientes,
      fornecedores,
      produtos,
      tarefas,
      funcionarios,
    };
  }
}

