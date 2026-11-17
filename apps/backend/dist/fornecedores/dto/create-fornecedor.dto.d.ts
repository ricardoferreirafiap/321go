export declare class CreateFornecedorDto {
    razaoSocial: string;
    nomeFantasia?: string | null;
    cnpj?: string | null;
    email?: string | null;
    telefone?: string | null;
    cep?: string | null;
    endereco?: string | null;
    complemento?: string | null;
    cidade?: string | null;
    estado?: string | null;
    status?: 'Ativo' | 'Inativo';
    categoria?: string | null;
}
