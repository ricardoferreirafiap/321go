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
exports.OrcamentosService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const orcamentos_repository_1 = require("./orcamentos.repository");
let OrcamentosService = class OrcamentosService {
    orcamentosRepository;
    constructor(orcamentosRepository) {
        this.orcamentosRepository = orcamentosRepository;
    }
    toResponse(item) {
        return {
            id: Number(item.id),
            numero: item.numero ?? '',
            publicToken: item.publicToken ?? undefined,
            cliente: item.cliente ?? '',
            email: item.email ?? '',
            perfilViagem: [],
            promptPerfilViagemIA: item.promptPerfilIa ?? '',
            promptRoteiroIA: item.promptRoteiroIa ?? '',
            passageiros: [],
            formaPagamento: '',
            parcelas: null,
            destino: item.destino ?? '',
            agenteViagem: item.agenteViagem ?? '',
            status: item.status ?? 'Rascunho',
            statusViagem: item.statusViagem ?? 'Não Iniciada',
            dataCriacao: item.dataCriacao
                ? new Date(item.dataCriacao).toISOString().slice(0, 10)
                : new Date(item.criadoEm).toISOString().slice(0, 10),
            dataValidade: item.dataValidade
                ? new Date(item.dataValidade).toISOString().slice(0, 10)
                : '',
            itens: Array.isArray(item.itens) ? item.itens : [],
            pacotes: Array.isArray(item.pacotes) ? item.pacotes : [],
            voos: Array.isArray(item.voos) ? item.voos : [],
            hospedagem: Array.isArray(item.hospedagem) ? item.hospedagem : [],
            roteiro: item.roteiro ?? '',
            dayByDay: Array.isArray(item.dayByDay) ? item.dayByDay : [],
            transporte: Array.isArray(item.transporte) ? item.transporte : [],
            restaurante: Array.isArray(item.restaurante) ? item.restaurante : [],
            experiencias: Array.isArray(item.experiencias) ? item.experiencias : [],
            seguro: Array.isArray(item.seguro) ? item.seguro : [],
            observacoes: item.observacoes ?? '',
        };
    }
    async findAll() {
        const itens = await this.orcamentosRepository.findAll();
        return itens.map((item) => this.toResponse(item));
    }
    async findOne(id) {
        const item = await this.orcamentosRepository.findOne(id);
        if (!item) {
            throw new common_1.NotFoundException('Orçamento não encontrado');
        }
        return this.toResponse(item);
    }
    async findByNumero(numero) {
        const item = await this.orcamentosRepository.findByNumero(String(numero || '').trim());
        if (!item) {
            throw new common_1.NotFoundException('Orçamento não encontrado');
        }
        return this.toResponse(item);
    }
    async findByPublicToken(publicToken) {
        const item = await this.orcamentosRepository.findByPublicToken(String(publicToken || '').trim());
        if (!item) {
            throw new common_1.NotFoundException('Orçamento não encontrado');
        }
        return this.toResponse(item);
    }
    async create(dto) {
        const payload = {
            ...dto,
            numero: dto.numero?.trim(),
            cliente: dto.cliente?.trim(),
            email: dto.email?.trim() || undefined,
            destino: dto.destino?.trim() || undefined,
            agenteViagem: dto.agenteViagem?.trim() || undefined,
            status: dto.status?.trim() || undefined,
            statusViagem: dto.statusViagem?.trim() || undefined,
            observacoes: dto.observacoes?.trim() || undefined,
            roteiro: dto.roteiro?.trim() || undefined,
            promptPerfilViagemIA: dto.promptPerfilViagemIA?.trim() || undefined,
            promptRoteiroIA: dto.promptRoteiroIA?.trim() || undefined,
            publicToken: dto.publicToken?.trim() || undefined,
        };
        try {
            const created = await this.orcamentosRepository.create(payload);
            return this.toResponse(created);
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new common_1.ConflictException('Já existe um orçamento com este número/token.');
            }
            throw error;
        }
    }
    async update(id, dto) {
        const exists = await this.orcamentosRepository.findOne(id);
        if (!exists) {
            throw new common_1.NotFoundException('Orçamento não encontrado');
        }
        const payload = {
            ...dto,
            numero: dto.numero?.trim(),
            cliente: dto.cliente?.trim(),
            email: dto.email?.trim() || undefined,
            destino: dto.destino?.trim() || undefined,
            agenteViagem: dto.agenteViagem?.trim() || undefined,
            status: dto.status?.trim() || undefined,
            statusViagem: dto.statusViagem?.trim() || undefined,
            observacoes: dto.observacoes?.trim() || undefined,
            roteiro: dto.roteiro?.trim() || undefined,
            promptPerfilViagemIA: dto.promptPerfilViagemIA?.trim() || undefined,
            promptRoteiroIA: dto.promptRoteiroIA?.trim() || undefined,
            publicToken: dto.publicToken?.trim() || undefined,
        };
        try {
            const updated = await this.orcamentosRepository.update(id, payload);
            return this.toResponse(updated);
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new common_1.ConflictException('Já existe um orçamento com este número/token.');
            }
            throw error;
        }
    }
    async remove(id) {
        const removed = await this.orcamentosRepository.remove(id);
        if (!removed) {
            throw new common_1.NotFoundException('Orçamento não encontrado');
        }
        return { deleted: true, id: Number(removed.id) };
    }
};
exports.OrcamentosService = OrcamentosService;
exports.OrcamentosService = OrcamentosService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [orcamentos_repository_1.OrcamentosRepository])
], OrcamentosService);
//# sourceMappingURL=orcamentos.service.js.map