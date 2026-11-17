import { TarefasRepository } from './tarefas.repository';
import { CreateTarefaDto } from './dto/create-tarefa.dto';
import { UpdateTarefaDto } from './dto/update-tarefa.dto';
export type TarefaResponseDto = {
    id: number;
    titulo: string;
    descricao: string | null;
    responsavel: string | null;
    prioridade: 'Alta' | 'Média' | 'Baixa';
    status: 'Pendente' | 'Em andamento' | 'Concluída' | 'Cancelada';
    prazo: string | null;
    categoria: string | null;
    criadoEm: string;
    atualizadoEm: string;
};
export declare class TarefasService {
    private readonly tarefasRepository;
    constructor(tarefasRepository: TarefasRepository);
    private toResponse;
    findAll(): Promise<TarefaResponseDto[]>;
    findOne(id: number): Promise<TarefaResponseDto>;
    create(dto: CreateTarefaDto): Promise<TarefaResponseDto>;
    update(id: number, dto: UpdateTarefaDto): Promise<TarefaResponseDto>;
    remove(id: number): Promise<{
        deleted: boolean;
        id: number;
    }>;
}
