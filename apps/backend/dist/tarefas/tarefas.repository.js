"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TarefasRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let TarefasRepository = class TarefasRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    findAll() {
        const prisma = this.prisma;
        return prisma.tarefa.findMany({
            orderBy: { criadoEm: 'desc' },
        });
    }
    findOne(id) {
        const prisma = this.prisma;
        return prisma.tarefa.findUnique({
            where: { id: BigInt(id) },
        });
    }
    create(dto) {
        const prisma = this.prisma;
        return prisma.tarefa.create({
            data: {
                titulo: dto.titulo,
                descricao: dto.descricao ?? null,
                responsavel: dto.responsavel ?? null,
                prioridade: dto.prioridade ?? 'Média',
                status: dto.status ?? 'Pendente',
                prazo: dto.prazo ? new Date(dto.prazo) : null,
                categoria: dto.categoria ?? null,
            },
        });
    }
    update(id, dto) {
        const prisma = this.prisma;
        return prisma.tarefa.update({
            where: { id: BigInt(id) },
            data: {
                titulo: dto.titulo ?? undefined,
                descricao: dto.descricao ?? undefined,
                responsavel: dto.responsavel ?? undefined,
                prioridade: dto.prioridade ?? undefined,
                status: dto.status ?? undefined,
                prazo: dto.prazo ? new Date(dto.prazo) : undefined,
                categoria: dto.categoria ?? undefined,
            },
        });
    }
    remove(id) {
        const prisma = this.prisma;
        return prisma.tarefa.delete({
            where: { id: BigInt(id) },
        });
    }
};
exports.TarefasRepository = TarefasRepository;
exports.TarefasRepository = TarefasRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TarefasRepository);
//# sourceMappingURL=tarefas.repository.js.map