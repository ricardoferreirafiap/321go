import { PrismaService } from '../prisma/prisma.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
export declare class LeadsRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(): import(".prisma/client").Prisma.PrismaPromise<{
        id: bigint;
        criadoEm: Date;
        atualizadoEm: Date;
        nome: string;
        email: string | null;
        status: string;
        whatsapp: string | null;
        statusCrm: string;
        viagens: number;
        atendente: string | null;
    }[]>;
    findOne(id: number): import(".prisma/client").Prisma.Prisma__LeadClient<{
        id: bigint;
        criadoEm: Date;
        atualizadoEm: Date;
        nome: string;
        email: string | null;
        status: string;
        whatsapp: string | null;
        statusCrm: string;
        viagens: number;
        atendente: string | null;
    }, null, import("@prisma/client/runtime/client").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    create(dto: CreateLeadDto): import(".prisma/client").Prisma.Prisma__LeadClient<{
        id: bigint;
        criadoEm: Date;
        atualizadoEm: Date;
        nome: string;
        email: string | null;
        status: string;
        whatsapp: string | null;
        statusCrm: string;
        viagens: number;
        atendente: string | null;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    update(id: number, dto: UpdateLeadDto): import(".prisma/client").Prisma.Prisma__LeadClient<{
        id: bigint;
        criadoEm: Date;
        atualizadoEm: Date;
        nome: string;
        email: string | null;
        status: string;
        whatsapp: string | null;
        statusCrm: string;
        viagens: number;
        atendente: string | null;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    remove(id: number): import(".prisma/client").Prisma.Prisma__LeadClient<{
        id: bigint;
        criadoEm: Date;
        atualizadoEm: Date;
        nome: string;
        email: string | null;
        status: string;
        whatsapp: string | null;
        statusCrm: string;
        viagens: number;
        atendente: string | null;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
}
