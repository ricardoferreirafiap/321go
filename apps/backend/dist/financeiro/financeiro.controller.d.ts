import { FinanceiroService } from './financeiro.service';
import { CreateFinanceiroDto } from './dto/create-financeiro.dto';
import { UpdateFinanceiroDto } from './dto/update-financeiro.dto';
export declare class FinanceiroController {
    private readonly financeiroService;
    constructor(financeiroService: FinanceiroService);
    findAll(): Promise<import("./financeiro.service").FinanceiroResponseDto[]>;
    findOne(id: number): Promise<import("./financeiro.service").FinanceiroResponseDto>;
    create(dto: CreateFinanceiroDto): Promise<import("./financeiro.service").FinanceiroResponseDto>;
    update(id: number, dto: UpdateFinanceiroDto): Promise<import("./financeiro.service").FinanceiroResponseDto>;
    remove(id: number): Promise<{
        deleted: boolean;
    }>;
}
