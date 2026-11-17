import { CreateFuncionarioDto } from './dto/create-funcionario.dto';
import { UpdateFuncionarioDto } from './dto/update-funcionario.dto';
import { FuncionariosService } from './funcionarios.service';
export declare class FuncionariosController {
    private readonly funcionariosService;
    constructor(funcionariosService: FuncionariosService);
    findAll(): Promise<import("./funcionarios.service").FuncionarioResponseDto[]>;
    findOne(id: number): Promise<import("./funcionarios.service").FuncionarioResponseDto>;
    create(dto: CreateFuncionarioDto): Promise<import("./funcionarios.service").FuncionarioResponseDto>;
    update(id: number, dto: UpdateFuncionarioDto): Promise<import("./funcionarios.service").FuncionarioResponseDto>;
    remove(id: number): Promise<{
        deleted: boolean;
        id: number;
    }>;
    login(body: {
        email: string;
        password: string;
    }): Promise<{
        message: string;
        accessToken: string;
        funcionario: import("./funcionarios.service").FuncionarioResponseDto;
    }>;
}
