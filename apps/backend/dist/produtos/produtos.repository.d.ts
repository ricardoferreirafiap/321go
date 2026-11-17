import { PrismaService } from '../prisma/prisma.service';
import { CreateProdutoDto } from './dto/create-produto.dto';
import { UpdateProdutoDto } from './dto/update-produto.dto';
export declare class ProdutosRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(): any;
    findOne(id: number): any;
    create(dto: CreateProdutoDto): any;
    update(id: number, dto: UpdateProdutoDto): any;
    remove(id: number): any;
}
