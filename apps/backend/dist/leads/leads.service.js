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
exports.LeadsService = void 0;
const common_1 = require("@nestjs/common");
const leads_repository_1 = require("./leads.repository");
let LeadsService = class LeadsService {
    leadsRepository;
    constructor(leadsRepository) {
        this.leadsRepository = leadsRepository;
    }
    toResponse(row) {
        return {
            id: Number(row.id),
            nome: String(row.nome),
            email: row.email ?? null,
            whatsapp: row.whatsapp ?? null,
            status: row.status ?? 'Novo',
            statusCrm: row.statusCrm ?? 'Novo Lead',
            viagens: Number(row.viagens ?? 0),
            criadoEm: row.criadoEm ? new Date(row.criadoEm).toISOString().slice(0, 10) : '',
            atendente: row.atendente ?? null,
            atualizadoEm: row.atualizadoEm ? new Date(row.atualizadoEm).toISOString() : new Date().toISOString(),
        };
    }
    async findAll() {
        const rows = await this.leadsRepository.findAll();
        return rows.map((row) => this.toResponse(row));
    }
    async findOne(id) {
        const item = await this.leadsRepository.findOne(id);
        if (!item) {
            throw new common_1.NotFoundException('Lead não encontrado');
        }
        return this.toResponse(item);
    }
    async create(dto) {
        const item = await this.leadsRepository.create(dto);
        return this.toResponse(item);
    }
    async update(id, dto) {
        const existing = await this.leadsRepository.findOne(id);
        if (!existing) {
            throw new common_1.NotFoundException('Lead não encontrado');
        }
        const item = await this.leadsRepository.update(id, dto);
        return this.toResponse(item);
    }
    async remove(id) {
        const existing = await this.leadsRepository.findOne(id);
        if (!existing) {
            throw new common_1.NotFoundException('Lead não encontrado');
        }
        await this.leadsRepository.remove(id);
        return { deleted: true, id };
    }
};
exports.LeadsService = LeadsService;
exports.LeadsService = LeadsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [leads_repository_1.LeadsRepository])
], LeadsService);
//# sourceMappingURL=leads.service.js.map