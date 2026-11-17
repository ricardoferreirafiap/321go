import { FornecedoresRepository } from './fornecedores.repository';
import { CreateFornecedorDto } from './dto/create-fornecedor.dto';
import { UpdateFornecedorDto } from './dto/update-fornecedor.dto';
export type FornecedorResponseDto = {
    id: number;
    razaoSocial: string;
    nomeFantasia: string | null;
    cnpj: string | null;
    email: string | null;
    telefone: string | null;
    cep: string | null;
    endereco: string | null;
    complemento: string | null;
    cidade: string | null;
    estado: string | null;
    status: 'Ativo' | 'Inativo';
    categoria: string | null;
    criadoEm: string;
    atualizadoEm: string;
};
export declare class FornecedoresService {
    private readonly fornecedoresRepository;
    constructor(fornecedoresRepository: FornecedoresRepository);
    private toResponse;
    findAll(): Promise<FornecedorResponseDto[]>;
    findOne(id: number): Promise<FornecedorResponseDto>;
    create(dto: CreateFornecedorDto): Promise<FornecedorResponseDto>;
    update(id: number, dto: UpdateFornecedorDto): Promise<FornecedorResponseDto>;
    remove(id: number): Promise<{
        deleted: boolean;
        id: number;
    }>;
}
