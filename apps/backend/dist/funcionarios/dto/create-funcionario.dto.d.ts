export declare class CreateFuncionarioDto {
    name: string;
    role?: string | null;
    department?: string | null;
    status?: 'Ativo' | 'Inativo';
    initials?: string | null;
    accessLevel?: 'Administrador' | 'Agente';
    email: string;
    password?: string | null;
    saudacoes?: string | null;
    photo?: string | null;
}
