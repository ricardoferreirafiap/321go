export declare class CreateProdutoDto {
    nome: string;
    codigo?: string | null;
    categoria?: string | null;
    preco: number;
    fornecedor?: string | null;
    operadora?: string | null;
    unidade?: string | null;
    status?: 'Ativo' | 'Inativo';
}
