import { Transform } from 'class-transformer';
import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateFuncionarioDto {
  @IsString()
  @MinLength(1)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  role?: string | null;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  department?: string | null;

  @IsOptional()
  @IsIn(['Ativo', 'Inativo'])
  status?: 'Ativo' | 'Inativo';

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  initials?: string | null;

  @IsOptional()
  @IsIn(['Administrador', 'Agente'])
  accessLevel?: 'Administrador' | 'Agente';

  @IsEmail()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  password?: string | null;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  saudacoes?: string | null;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  photo?: string | null;
}

