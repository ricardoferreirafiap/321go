import { PrismaService } from '../prisma/prisma.service';
import { CreateFinanceiroDto } from './dto/create-financeiro.dto';
import { UpdateFinanceiroDto } from './dto/update-financeiro.dto';
export type FinanceiroResponseDto = {
    id: number;
    tipo: 'receita' | 'despesa';
    descricao: string;
    valor: number;
    comissaoPercentual: number | null;
    comissaoValor: number | null;
    data: string;
    oculto: boolean;
    orcamentoPago: boolean;
    formaPagamento: string | null;
    parcelas: number | null;
    orcamentoId: number | null;
    orcamentoNumero: string | null;
    cliente: string | null;
    criadoEm: string;
    atualizadoEm: string;
};
export declare class FinanceiroService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private toResponse;
    findAll(): Promise<FinanceiroResponseDto[]>;
    findOne(id: number): Promise<FinanceiroResponseDto>;
    create(dto: CreateFinanceiroDto): Promise<FinanceiroResponseDto>;
    update(id: number, dto: UpdateFinanceiroDto): Promise<FinanceiroResponseDto>;
    remove(id: number): Promise<{
        deleted: boolean;
    }>;
}
