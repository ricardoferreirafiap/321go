import { ProdutosRepository } from './produtos.repository';
import { CreateProdutoDto } from './dto/create-produto.dto';
import { UpdateProdutoDto } from './dto/update-produto.dto';
export type ProdutoResponseDto = {
    id: number;
    nome: string;
    codigo: string | null;
    categoria: string | null;
    preco: number;
    fornecedor: string | null;
    operadora: string | null;
    unidade: string;
    status: 'Ativo' | 'Inativo';
    criadoEm: string;
    atualizadoEm: string;
};
export declare class ProdutosService {
    private readonly produtosRepository;
    constructor(produtosRepository: ProdutosRepository);
    private toResponse;
    findAll(): Promise<ProdutoResponseDto[]>;
    findOne(id: number): Promise<ProdutoResponseDto>;
    create(dto: CreateProdutoDto): Promise<ProdutoResponseDto>;
    update(id: number, dto: UpdateProdutoDto): Promise<ProdutoResponseDto>;
    remove(id: number): Promise<{
        deleted: boolean;
        id: number;
    }>;
}
