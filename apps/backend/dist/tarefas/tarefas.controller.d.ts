import { CreateTarefaDto } from './dto/create-tarefa.dto';
import { UpdateTarefaDto } from './dto/update-tarefa.dto';
import { TarefasService } from './tarefas.service';
export declare class TarefasController {
    private readonly tarefasService;
    constructor(tarefasService: TarefasService);
    findAll(): Promise<import("./tarefas.service").TarefaResponseDto[]>;
    findOne(id: number): Promise<import("./tarefas.service").TarefaResponseDto>;
    create(dto: CreateTarefaDto): Promise<import("./tarefas.service").TarefaResponseDto>;
    update(id: number, dto: UpdateTarefaDto): Promise<import("./tarefas.service").TarefaResponseDto>;
    remove(id: number): Promise<{
        deleted: boolean;
        id: number;
    }>;
}
