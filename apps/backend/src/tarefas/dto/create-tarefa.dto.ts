import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateTarefaDto {
  @IsString()
  @MinLength(1)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  titulo: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  descricao?: string | null;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  responsavel?: string | null;

  @IsOptional()
  @IsIn(['Alta', 'Média', 'Baixa'])
  prioridade?: 'Alta' | 'Média' | 'Baixa';

  @IsOptional()
  @IsIn(['Pendente', 'Em andamento', 'Concluída', 'Cancelada'])
  status?: 'Pendente' | 'Em andamento' | 'Concluída' | 'Cancelada';

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  prazo?: string | null;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  categoria?: string | null;
}

