export declare class CreateTarefaDto {
    titulo: string;
    descricao?: string | null;
    responsavel?: string | null;
    prioridade?: 'Alta' | 'Média' | 'Baixa';
    status?: 'Pendente' | 'Em andamento' | 'Concluída' | 'Cancelada';
    prazo?: string | null;
    categoria?: string | null;
}
