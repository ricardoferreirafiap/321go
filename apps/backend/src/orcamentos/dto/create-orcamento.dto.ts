import {
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateOrcamentoDto {
  @IsString()
  @MaxLength(20)
  numero!: string;

  @IsString()
  @MaxLength(150)
  cliente!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  destino?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  agenteViagem?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  statusViagem?: string;

  @IsOptional()
  @IsDateString()
  dataCriacao?: string;

  @IsOptional()
  @IsDateString()
  dataValidade?: string;

  @IsOptional()
  @IsString()
  observacoes?: string;

  @IsOptional()
  @IsArray()
  itens?: unknown[];

  @IsOptional()
  @IsArray()
  pacotes?: unknown[];

  @IsOptional()
  @IsArray()
  voos?: unknown[];

  @IsOptional()
  @IsArray()
  hospedagem?: unknown[];

  @IsOptional()
  @IsString()
  roteiro?: string;

  @IsOptional()
  @IsString()
  promptRoteiroIA?: string;

  @IsOptional()
  @IsArray()
  dayByDay?: unknown[];

  @IsOptional()
  @IsArray()
  transporte?: unknown[];

  @IsOptional()
  @IsArray()
  restaurante?: unknown[];

  @IsOptional()
  @IsArray()
  experiencias?: unknown[];

  @IsOptional()
  @IsArray()
  seguro?: unknown[];

  @IsOptional()
  @IsString()
  promptPerfilViagemIA?: string;

  @IsOptional()
  @IsString()
  publicToken?: string;

  // Mantidos para compatibilidade com payload atual do frontend.
  @IsOptional()
  @IsArray()
  perfilViagem?: string[];

  @IsOptional()
  @IsArray()
  passageiros?: string[];

  @IsOptional()
  @IsString()
  formaPagamento?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  parcelas?: number;
}

