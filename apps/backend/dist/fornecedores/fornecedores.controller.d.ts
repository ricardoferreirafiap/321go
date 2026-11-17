import { CreateFornecedorDto } from './dto/create-fornecedor.dto';
import { UpdateFornecedorDto } from './dto/update-fornecedor.dto';
import { FornecedoresService } from './fornecedores.service';
export declare class FornecedoresController {
    private readonly fornecedoresService;
    constructor(fornecedoresService: FornecedoresService);
    findAll(): Promise<import("./fornecedores.service").FornecedorResponseDto[]>;
    findOne(id: number): Promise<import("./fornecedores.service").FornecedorResponseDto>;
    create(dto: CreateFornecedorDto): Promise<import("./fornecedores.service").FornecedorResponseDto>;
    update(id: number, dto: UpdateFornecedorDto): Promise<import("./fornecedores.service").FornecedorResponseDto>;
    remove(id: number): Promise<{
        deleted: boolean;
        id: number;
    }>;
}
