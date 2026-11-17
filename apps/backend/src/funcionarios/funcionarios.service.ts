import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { FuncionariosRepository } from './funcionarios.repository';
import { CreateFuncionarioDto } from './dto/create-funcionario.dto';
import { UpdateFuncionarioDto } from './dto/update-funcionario.dto';

export type FuncionarioResponseDto = {
  id: number;
  name: string;
  role: string | null;
  department: string | null;
  status: 'Ativo' | 'Inativo';
  initials: string | null;
  accessLevel: 'Administrador' | 'Agente';
  email: string;
  saudacoes?: string | null;
  photo?: string | null;
  criadoEm: string;
  atualizadoEm: string;
};

@Injectable()
export class FuncionariosService {
  constructor(private readonly funcionariosRepository: FuncionariosRepository) {}

  private formatDate(value: unknown): string {
    if (!value) {
      return '';
    }

    const parsed = new Date(value as string | number | Date);
    return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString();
  }

  private isSchemaDriftError(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === 'P2021' || error.code === 'P2022')
    );
  }

  private toResponse(item: any): FuncionarioResponseDto {
    return {
      id: Number(item.id),
      name: item.nome,
      role: item.cargo ?? null,
      department: item.departamento ?? null,
      status: item.status ?? 'Ativo',
      initials: item.iniciais ?? null,
      accessLevel: item.nivelAcesso ?? 'Agente',
      email: item.email,
      saudacoes: item.saudacoes ?? null,
      photo: item.fotoUrl ?? null,
      criadoEm: this.formatDate(item.criadoEm),
      atualizadoEm: this.formatDate(item.atualizadoEm),
    };
  }

  async findAll() {
    try {
      const itens: any[] = await this.funcionariosRepository.findAll();
      return itens.map((item: any) => this.toResponse(item));
    } catch (error) {
      if (this.isSchemaDriftError(error)) {
        return [];
      }
      throw error;
    }
  }

  async findOne(id: number) {
    const item = await this.funcionariosRepository.findOne(id);
    if (!item) {
      throw new NotFoundException('Funcionário não encontrado');
    }
    return this.toResponse(item);
  }

  async create(dto: CreateFuncionarioDto) {
    const item = await this.funcionariosRepository.create(dto);
    return this.toResponse(item);
  }

  async update(id: number, dto: UpdateFuncionarioDto) {
    const existing = await this.funcionariosRepository.findOne(id);
    if (!existing) {
      throw new NotFoundException('Funcionário não encontrado');
    }

    const item = await this.funcionariosRepository.update(id, dto);
    return this.toResponse(item);
  }

  async remove(id: number) {
    const existing = await this.funcionariosRepository.findOne(id);
    if (!existing) {
      throw new NotFoundException('Funcionário não encontrado');
    }

    await this.funcionariosRepository.remove(id);
    return { deleted: true, id };
  }

  async login(email: string, password: string) {
    const funcionario = await this.funcionariosRepository.findByEmail(email);
    if (!funcionario) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (!funcionario.senhaHash || funcionario.senhaHash !== password) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    return {
      message: 'Login realizado com sucesso.',
      accessToken: `demo-token-${Date.now()}`,
      funcionario: this.toResponse(funcionario),
    };
  }
}