import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
export declare class LeadsController {
    private readonly leadsService;
    constructor(leadsService: LeadsService);
    findAll(): Promise<import("./leads.service").LeadResponseDto[]>;
    findOne(id: number): Promise<import("./leads.service").LeadResponseDto>;
    create(dto: CreateLeadDto): Promise<import("./leads.service").LeadResponseDto>;
    update(id: number, dto: UpdateLeadDto): Promise<import("./leads.service").LeadResponseDto>;
    remove(id: number): Promise<{
        deleted: boolean;
        id: number;
    }>;
}
