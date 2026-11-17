import { FuncionariosRepository } from './funcionarios.repository';
import { CreateFuncionarioDto } from './dto/create-funcionario.dto';
import { UpdateFuncionarioDto } from './dto/update-funcionario.dto';
export type FuncionarioResponseDto = {
    id: number;
    name: string;
    role: string | null;
    department: string | null;
    status: 'Ativo' | 'Inativo';
    initials: string | null;
    accessLevel: 'Administrador' | 'Agente';
    email: string;
    saudacoes?: string | null;
    photo?: string | null;
    criadoEm: string;
    atualizadoEm: string;
};
export declare class FuncionariosService {
    private readonly funcionariosRepository;
    constructor(funcionariosRepository: FuncionariosRepository);
    private toResponse;
    findAll(): Promise<FuncionarioResponseDto[]>;
    findOne(id: number): Promise<FuncionarioResponseDto>;
    create(dto: CreateFuncionarioDto): Promise<FuncionarioResponseDto>;
    update(id: number, dto: UpdateFuncionarioDto): Promise<FuncionarioResponseDto>;
    remove(id: number): Promise<{
        deleted: boolean;
        id: number;
    }>;
    login(email: string, password: string): Promise<{
        message: string;
        accessToken: string;
        funcionario: FuncionarioResponseDto;
    }>;
}
