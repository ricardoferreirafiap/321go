import { CreateProdutoDto } from './dto/create-produto.dto';
import { UpdateProdutoDto } from './dto/update-produto.dto';
import { ProdutosService } from './produtos.service';
export declare class ProdutosController {
    private readonly produtosService;
    constructor(produtosService: ProdutosService);
    findAll(): Promise<import("./produtos.service").ProdutoResponseDto[]>;
    findOne(id: number): Promise<import("./produtos.service").ProdutoResponseDto>;
    create(dto: CreateProdutoDto): Promise<import("./produtos.service").ProdutoResponseDto>;
    update(id: number, dto: UpdateProdutoDto): Promise<import("./produtos.service").ProdutoResponseDto>;
    remove(id: number): Promise<{
        deleted: boolean;
        id: number;
    }>;
}
