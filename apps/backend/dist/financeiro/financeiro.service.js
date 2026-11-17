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
exports.FinanceiroService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let FinanceiroService = class FinanceiroService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    toResponse(item) {
        return {
            id: Number(item.id),
            tipo: item.tipo,
            descricao: item.descricao,
            valor: Number(item.valor),
            comissaoPercentual: item.comissaoPercentual == null ? null : Number(item.comissaoPercentual),
            comissaoValor: item.comissaoValor == null ? null : Number(item.comissaoValor),
            data: item.dataLancamento ? new Date(item.dataLancamento).toISOString().slice(0, 10) : '',
            oculto: Boolean(item.oculto),
            orcamentoPago: Boolean(item.orcamentoPago),
            formaPagamento: item.formaPagamento ?? null,
            parcelas: item.parcelas ?? null,
            orcamentoId: item.orcamentoId == null ? null : Number(item.orcamentoId),
            orcamentoNumero: item.orcamentoNumero ?? null,
            cliente: item.clienteNome ?? null,
            criadoEm: new Date(item.criadoEm).toISOString(),
            atualizadoEm: new Date(item.atualizadoEm).toISOString(),
        };
    }
    async findAll() {
        const itens = await this.prisma.financeiro.findMany({
            orderBy: { criadoEm: 'desc' },
        });
        return itens.map((item) => this.toResponse(item));
    }
    async findOne(id) {
        const item = await this.prisma.financeiro.findUnique({ where: { id: BigInt(id) } });
        if (!item) {
            throw new common_1.NotFoundException('Financeiro não encontrado');
        }
        return this.toResponse(item);
    }
    create(dto) {
        return this.prisma.financeiro.create({
            data: {
                tipo: dto.tipo,
                descricao: dto.descricao,
                valor: dto.valor,
                comissaoPercentual: dto.comissaoPercentual ?? null,
                comissaoValor: dto.comissaoValor ?? null,
                dataLancamento: new Date(dto.data),
                oculto: dto.oculto ?? false,
                orcamentoPago: dto.orcamentoPago ?? false,
                formaPagamento: dto.formaPagamento ?? null,
                parcelas: dto.parcelas ?? null,
                orcamentoId: dto.orcamentoId ? BigInt(dto.orcamentoId) : null,
                orcamentoNumero: dto.orcamentoNumero ?? null,
                clienteNome: dto.cliente ?? null,
            },
        }).then((item) => this.toResponse(item));
    }
    async update(id, dto) {
        const item = await this.prisma.financeiro.findUnique({ where: { id: BigInt(id) } });
        if (!item) {
            throw new common_1.NotFoundException('Financeiro não encontrado');
        }
        const updated = await this.prisma.financeiro.update({
            where: { id: BigInt(id) },
            data: {
                tipo: dto.tipo,
                descricao: dto.descricao,
                valor: dto.valor,
                comissaoPercentual: dto.comissaoPercentual ?? null,
                comissaoValor: dto.comissaoValor ?? null,
                dataLancamento: dto.data ? new Date(dto.data) : item.dataLancamento,
                oculto: dto.oculto ?? item.oculto,
                orcamentoPago: dto.orcamentoPago ?? item.orcamentoPago,
                formaPagamento: dto.formaPagamento ?? item.formaPagamento,
                parcelas: dto.parcelas ?? item.parcelas,
                orcamentoId: dto.orcamentoId ? BigInt(dto.orcamentoId) : item.orcamentoId,
                orcamentoNumero: dto.orcamentoNumero ?? item.orcamentoNumero,
                clienteNome: dto.cliente ?? item.clienteNome,
            },
        });
        return this.toResponse(updated);
    }
    async remove(id) {
        const item = await this.prisma.financeiro.findUnique({ where: { id: BigInt(id) } });
        if (!item) {
            throw new common_1.NotFoundException('Financeiro não encontrado');
        }
        await this.prisma.financeiro.delete({ where: { id: BigInt(id) } });
        return { deleted: true };
    }
};
exports.FinanceiroService = FinanceiroService;
exports.FinanceiroService = FinanceiroService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FinanceiroService);
//# sourceMappingURL=financeiro.service.js.map