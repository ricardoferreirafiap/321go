import { ClientesRepository } from './clientes.repository';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
export type ClienteResponseDto = {
    id: number;
    nome: string | null;
    sobrenome: string | null;
    nomeCompleto: string | null;
    email: string | null;
    telefone: string | null;
    cep: string | null;
    endereco: string | null;
    numero: string | null;
    complemento: string | null;
    cidade: string | null;
    estado: string | null;
    status: 'Ativo' | 'Inativo';
    cpfCnpj: string | null;
    rg: string | null;
    dataNascimento: string | null;
    documentoNome: string | null;
    criadoEm: string;
    atualizadoEm: string;
};
export declare class ClientesService {
    private readonly clientesRepository;
    constructor(clientesRepository: ClientesRepository);
    private toResponse;
    findAll(): Promise<ClienteResponseDto[]>;
    findOne(id: number): Promise<ClienteResponseDto>;
    create(dto: CreateClienteDto): Promise<ClienteResponseDto>;
    update(id: number, dto: UpdateClienteDto): Promise<ClienteResponseDto>;
    remove(id: number): Promise<{
        deleted: boolean;
        id: number;
    }>;
}
