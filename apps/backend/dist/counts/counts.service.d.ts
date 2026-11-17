import { PrismaService } from '../prisma/prisma.service';
export declare class CountsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getCounts(): Promise<{
        clientes: any;
        fornecedores: any;
        produtos: any;
        tarefas: any;
        funcionarios: any;
    }>;
}
