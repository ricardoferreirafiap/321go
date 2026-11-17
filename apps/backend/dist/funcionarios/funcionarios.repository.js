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
exports.FuncionariosRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let FuncionariosRepository = class FuncionariosRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    findAll() {
        const prisma = this.prisma;
        return prisma.funcionario.findMany({
            orderBy: { criadoEm: 'desc' },
        });
    }
    findOne(id) {
        const prisma = this.prisma;
        return prisma.funcionario.findUnique({
            where: { id: BigInt(id) },
        });
    }
    findByEmail(email) {
        const prisma = this.prisma;
        return prisma.funcionario.findFirst({
            where: { email: email.trim().toLowerCase() },
        });
    }
    create(dto) {
        const prisma = this.prisma;
        return prisma.funcionario.create({
            data: {
                nome: dto.name,
                email: dto.email,
                senhaHash: dto.password ? dto.password : null,
                cargo: dto.role ?? null,
                departamento: dto.department ?? null,
                status: dto.status ?? 'Ativo',
                nivelAcesso: dto.accessLevel ?? 'Agente',
                fotoUrl: dto.photo ?? null,
                saudacoes: dto.saudacoes ?? null,
                iniciais: dto.initials ?? null,
            },
        });
    }
    update(id, dto) {
        const prisma = this.prisma;
        return prisma.funcionario.update({
            where: { id: BigInt(id) },
            data: {
                nome: dto.name ?? undefined,
                email: dto.email ?? undefined,
                senhaHash: dto.password !== undefined ? (dto.password || null) : undefined,
                cargo: dto.role ?? undefined,
                departamento: dto.department ?? undefined,
                status: dto.status ?? undefined,
                nivelAcesso: dto.accessLevel ?? undefined,
                fotoUrl: dto.photo ?? undefined,
                saudacoes: dto.saudacoes ?? undefined,
                iniciais: dto.initials ?? undefined,
            },
        });
    }
    remove(id) {
        const prisma = this.prisma;
        return prisma.funcionario.delete({
            where: { id: BigInt(id) },
        });
    }
};
exports.FuncionariosRepository = FuncionariosRepository;
exports.FuncionariosRepository = FuncionariosRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FuncionariosRepository);
//# sourceMappingURL=funcionarios.repository.js.map