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
exports.LeadsRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let LeadsRepository = class LeadsRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    findAll() {
        return this.prisma.lead.findMany({
            orderBy: { criadoEm: 'desc' },
        });
    }
    findOne(id) {
        return this.prisma.lead.findUnique({
            where: { id: BigInt(id) },
        });
    }
    create(dto) {
        return this.prisma.lead.create({
            data: {
                nome: dto.nome,
                email: dto.email ?? null,
                whatsapp: dto.whatsapp ?? null,
                status: dto.status ?? 'Novo',
                statusCrm: dto.statusCrm ?? 'Novo Lead',
                viagens: dto.viagens ?? 0,
                criadoEm: dto.criadoEm ? new Date(dto.criadoEm) : new Date(),
                atendente: dto.atendente ?? null,
            },
        });
    }
    update(id, dto) {
        return this.prisma.lead.update({
            where: { id: BigInt(id) },
            data: {
                nome: dto.nome ?? undefined,
                email: dto.email ?? undefined,
                whatsapp: dto.whatsapp ?? undefined,
                status: dto.status ?? undefined,
                statusCrm: dto.statusCrm ?? undefined,
                viagens: dto.viagens ?? undefined,
                criadoEm: dto.criadoEm ? new Date(dto.criadoEm) : undefined,
                atendente: dto.atendente ?? undefined,
            },
        });
    }
    remove(id) {
        return this.prisma.lead.delete({
            where: { id: BigInt(id) },
        });
    }
};
exports.LeadsRepository = LeadsRepository;
exports.LeadsRepository = LeadsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LeadsRepository);
//# sourceMappingURL=leads.repository.js.map