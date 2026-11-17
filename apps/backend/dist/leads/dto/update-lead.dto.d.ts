export declare class UpdateLeadDto {
    nome?: string;
    email?: string | null;
    whatsapp?: string | null;
    status?: 'Novo' | 'Em Contato' | 'Qualificado' | 'Perdido' | 'Vendido';
    statusCrm?: 'Novo Lead' | 'Qualificação' | 'Reunião' | 'Follow-ups' | 'Pagos' | 'Nutrição' | 'Finalizados';
    viagens?: number;
    criadoEm?: string | null;
    atendente?: string | null;
}
