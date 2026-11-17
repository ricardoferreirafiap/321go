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
exports.OrcamentosRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let OrcamentosRepository = class OrcamentosRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    toJsonCreateValue(value) {
        return (value ?? []);
    }
    toJsonUpdateValue(value) {
        if (value === undefined) {
            return undefined;
        }
        return value;
    }
    findAll() {
        return this.prisma.orcamento.findMany({
            orderBy: { criadoEm: 'desc' },
        });
    }
    findOne(id) {
        return this.prisma.orcamento.findUnique({
            where: { id: BigInt(id) },
        });
    }
    findByNumero(numero) {
        return this.prisma.orcamento.findUnique({
            where: { numero },
        });
    }
    findByPublicToken(publicToken) {
        return this.prisma.orcamento.findFirst({
            where: { publicToken },
        });
    }
    create(dto) {
        return this.prisma.orcamento.create({
            data: {
                numero: dto.numero,
                cliente: dto.cliente,
                email: dto.email ?? null,
                destino: dto.destino ?? null,
                agenteViagem: dto.agenteViagem ?? null,
                status: dto.status ?? 'Rascunho',
                statusViagem: dto.statusViagem ?? null,
                dataCriacao: dto.dataCriacao ? new Date(dto.dataCriacao) : null,
                dataValidade: dto.dataValidade ? new Date(dto.dataValidade) : null,
                observacoes: dto.observacoes ?? null,
                itens: this.toJsonCreateValue(dto.itens),
                pacotes: this.toJsonCreateValue(dto.pacotes),
                voos: this.toJsonCreateValue(dto.voos),
                hospedagem: this.toJsonCreateValue(dto.hospedagem),
                roteiro: dto.roteiro ?? null,
                promptRoteiroIa: dto.promptRoteiroIA ?? null,
                dayByDay: this.toJsonCreateValue(dto.dayByDay),
                transporte: this.toJsonCreateValue(dto.transporte),
                restaurante: this.toJsonCreateValue(dto.restaurante),
                experiencias: this.toJsonCreateValue(dto.experiencias),
                seguro: this.toJsonCreateValue(dto.seguro),
                promptPerfilIa: dto.promptPerfilViagemIA ?? null,
                publicToken: dto.publicToken ?? null,
            },
        });
    }
    update(id, dto) {
        return this.prisma.orcamento.update({
            where: { id: BigInt(id) },
            data: {
                numero: dto.numero ?? undefined,
                cliente: dto.cliente ?? undefined,
                email: dto.email ?? undefined,
                destino: dto.destino ?? undefined,
                agenteViagem: dto.agenteViagem ?? undefined,
                status: dto.status ?? undefined,
                statusViagem: dto.statusViagem ?? undefined,
                dataCriacao: dto.dataCriacao ? new Date(dto.dataCriacao) : undefined,
                dataValidade: dto.dataValidade ? new Date(dto.dataValidade) : undefined,
                observacoes: dto.observacoes ?? undefined,
                itens: this.toJsonUpdateValue(dto.itens),
                pacotes: this.toJsonUpdateValue(dto.pacotes),
                voos: this.toJsonUpdateValue(dto.voos),
                hospedagem: this.toJsonUpdateValue(dto.hospedagem),
                roteiro: dto.roteiro ?? undefined,
                promptRoteiroIa: dto.promptRoteiroIA ?? undefined,
                dayByDay: this.toJsonUpdateValue(dto.dayByDay),
                transporte: this.toJsonUpdateValue(dto.transporte),
                restaurante: this.toJsonUpdateValue(dto.restaurante),
                experiencias: this.toJsonUpdateValue(dto.experiencias),
                seguro: this.toJsonUpdateValue(dto.seguro),
                promptPerfilIa: dto.promptPerfilViagemIA ?? undefined,
                publicToken: dto.publicToken ?? undefined,
            },
        });
    }
    async remove(id) {
        const item = await this.findOne(id);
        if (!item) {
            return null;
        }
        await this.prisma.orcamento.delete({
            where: { id: BigInt(id) },
        });
        return item;
    }
};
exports.OrcamentosRepository = OrcamentosRepository;
exports.OrcamentosRepository = OrcamentosRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OrcamentosRepository);
//# sourceMappingURL=orcamentos.repository.js.map