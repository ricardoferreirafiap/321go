import { PrismaService } from '../prisma/prisma.service';
import { CreateFuncionarioDto } from './dto/create-funcionario.dto';
import { UpdateFuncionarioDto } from './dto/update-funcionario.dto';
export declare class FuncionariosRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(): any;
    findOne(id: number): any;
    findByEmail(email: string): any;
    create(dto: CreateFuncionarioDto): any;
    update(id: number, dto: UpdateFuncionarioDto): any;
    remove(id: number): any;
}
