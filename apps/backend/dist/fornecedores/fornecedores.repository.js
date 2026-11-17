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
exports.FornecedoresRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let FornecedoresRepository = class FornecedoresRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    findAll() {
        return this.prisma.fornecedor.findMany({
            orderBy: { criadoEm: 'desc' },
        });
    }
    findOne(id) {
        return this.prisma.fornecedor.findUnique({
            where: { id: BigInt(id) },
        });
    }
    create(dto) {
        return this.prisma.fornecedor.create({
            data: {
                razaoSocial: dto.razaoSocial,
                nomeFantasia: dto.nomeFantasia ?? null,
                cnpj: dto.cnpj ?? null,
                email: dto.email ?? null,
                telefone: dto.telefone ?? null,
                cep: dto.cep ?? null,
                endereco: dto.endereco ?? null,
                complemento: dto.complemento ?? null,
                cidade: dto.cidade ?? null,
                estado: dto.estado ?? null,
                status: dto.status ?? 'Ativo',
                categoria: dto.categoria ?? null,
            },
        });
    }
    update(id, dto) {
        return this.prisma.fornecedor.update({
            where: { id: BigInt(id) },
            data: {
                razaoSocial: dto.razaoSocial ?? undefined,
                nomeFantasia: dto.nomeFantasia ?? undefined,
                cnpj: dto.cnpj ?? undefined,
                email: dto.email ?? undefined,
                telefone: dto.telefone ?? undefined,
                cep: dto.cep ?? undefined,
                endereco: dto.endereco ?? undefined,
                complemento: dto.complemento ?? undefined,
                cidade: dto.cidade ?? undefined,
                estado: dto.estado ?? undefined,
                status: dto.status ?? undefined,
                categoria: dto.categoria ?? undefined,
            },
        });
    }
    remove(id) {
        return this.prisma.fornecedor.delete({
            where: { id: BigInt(id) },
        });
    }
};
exports.FornecedoresRepository = FornecedoresRepository;
exports.FornecedoresRepository = FornecedoresRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FornecedoresRepository);
//# sourceMappingURL=fornecedores.repository.js.map