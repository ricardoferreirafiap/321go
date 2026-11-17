import { CountsService } from './counts.service';
export declare class CountsController {
    private readonly countsService;
    constructor(countsService: CountsService);
    getCounts(): Promise<{
        clientes: any;
        fornecedores: any;
        produtos: any;
        tarefas: any;
        funcionarios: any;
    }>;
}
