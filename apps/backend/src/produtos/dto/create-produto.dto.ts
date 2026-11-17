import { Transform } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateProdutoDto {
  @IsString()
  @MinLength(1)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  nome: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  codigo?: string | null;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  categoria?: string | null;

  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  preco: number;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  fornecedor?: string | null;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  operadora?: string | null;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  unidade?: string | null;

  @IsOptional()
  @IsIn(['Ativo', 'Inativo'])
  status?: 'Ativo' | 'Inativo';
}

