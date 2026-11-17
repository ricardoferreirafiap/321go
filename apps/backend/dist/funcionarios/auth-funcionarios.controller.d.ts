import { FuncionariosService } from './funcionarios.service';
type LoginBody = {
    email: string;
    password: string;
};
export declare class AuthFuncionariosController {
    private readonly funcionariosService;
    constructor(funcionariosService: FuncionariosService);
    login(body: LoginBody): Promise<{
        message: string;
        accessToken: string;
        funcionario: import("./funcionarios.service").FuncionarioResponseDto;
    }>;
}
export {};
