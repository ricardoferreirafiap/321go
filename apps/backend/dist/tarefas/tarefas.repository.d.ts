import { PrismaService } from '../prisma/prisma.service';
import { CreateTarefaDto } from './dto/create-tarefa.dto';
import { UpdateTarefaDto } from './dto/update-tarefa.dto';
export declare class TarefasRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(): any;
    findOne(id: number): any;
    create(dto: CreateTarefaDto): any;
    update(id: number, dto: UpdateTarefaDto): any;
    remove(id: number): any;
}
