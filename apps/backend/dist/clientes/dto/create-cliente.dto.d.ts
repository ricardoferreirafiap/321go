export declare class CreateClienteDto {
    nome: string;
    sobrenome?: string | null;
    nomeCompleto?: string | null;
    email?: string | null;
    telefone?: string | null;
    cep?: string | null;
    endereco?: string | null;
    numero?: string | null;
    complemento?: string | null;
    cidade?: string | null;
    estado?: string | null;
    status?: 'Ativo' | 'Inativo';
    cpfCnpj?: string | null;
    rg?: string | null;
    dataNascimento?: string | null;
    documentoNome?: string | null;
}
