import { LeadsRepository } from './leads.repository';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
export type LeadResponseDto = {
    id: number;
    nome: string;
    email: string | null;
    whatsapp: string | null;
    status: 'Novo' | 'Em Contato' | 'Qualificado' | 'Perdido' | 'Vendido';
    statusCrm: 'Novo Lead' | 'Qualificação' | 'Reunião' | 'Follow-ups' | 'Pagos' | 'Nutrição' | 'Finalizados';
    viagens: number;
    criadoEm: string;
    atendente: string | null;
    atualizadoEm: string;
};
export declare class LeadsService {
    private readonly leadsRepository;
    constructor(leadsRepository: LeadsRepository);
    private formatDate;
    private isSchemaDriftError;
    private toResponse;
    findAll(): Promise<LeadResponseDto[]>;
    findOne(id: number): Promise<LeadResponseDto>;
    create(dto: CreateLeadDto): Promise<LeadResponseDto>;
    update(id: number, dto: UpdateLeadDto): Promise<LeadResponseDto>;
    remove(id: number): Promise<{
        deleted: boolean;
        id: number;
    }>;
}
