import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdateLeadDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  nome?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  email?: string | null;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  whatsapp?: string | null;

  @IsOptional()
  @IsIn(['Novo', 'Em Contato', 'Qualificado', 'Perdido', 'Vendido'])
  status?: 'Novo' | 'Em Contato' | 'Qualificado' | 'Perdido' | 'Vendido';

  @IsOptional()
  @IsIn(['Novo Lead', 'Qualificação', 'Reunião', 'Follow-ups', 'Pagos', 'Nutrição', 'Finalizados'])
  statusCrm?: 'Novo Lead' | 'Qualificação' | 'Reunião' | 'Follow-ups' | 'Pagos' | 'Nutrição' | 'Finalizados';

  @IsOptional()
  @IsInt()
  @Min(0)
  @Transform(({ value }) => (value === undefined || value === null || value === '' ? undefined : Number(value)))
  viagens?: number;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  criadoEm?: string | null;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  atendente?: string | null;
}
