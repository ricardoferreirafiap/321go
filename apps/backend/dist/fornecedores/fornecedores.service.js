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
exports.FornecedoresService = void 0;
const common_1 = require("@nestjs/common");
const fornecedores_repository_1 = require("./fornecedores.repository");
let FornecedoresService = class FornecedoresService {
    fornecedoresRepository;
    constructor(fornecedoresRepository) {
        this.fornecedoresRepository = fornecedoresRepository;
    }
    toResponse(item) {
        return {
            id: Number(item.id),
            razaoSocial: item.razaoSocial,
            nomeFantasia: item.nomeFantasia ?? null,
            cnpj: item.cnpj ?? null,
            email: item.email ?? null,
            telefone: item.telefone ?? null,
            cep: item.cep ?? null,
            endereco: item.endereco ?? null,
            complemento: item.complemento ?? null,
            cidade: item.cidade ?? null,
            estado: item.estado ?? null,
            status: item.status ?? 'Ativo',
            categoria: item.categoria ?? null,
            criadoEm: new Date(item.criadoEm).toISOString(),
            atualizadoEm: new Date(item.atualizadoEm).toISOString(),
        };
    }
    async findAll() {
        const itens = await this.fornecedoresRepository.findAll();
        return itens.map((item) => this.toResponse(item));
    }
    async findOne(id) {
        const item = await this.fornecedoresRepository.findOne(id);
        if (!item) {
            throw new common_1.NotFoundException('Fornecedor não encontrado');
        }
        return this.toResponse(item);
    }
    async create(dto) {
        const item = await this.fornecedoresRepository.create(dto);
        return this.toResponse(item);
    }
    async update(id, dto) {
        const existing = await this.fornecedoresRepository.findOne(id);
        if (!existing) {
            throw new common_1.NotFoundException('Fornecedor não encontrado');
        }
        const item = await this.fornecedoresRepository.update(id, dto);
        return this.toResponse(item);
    }
    async remove(id) {
        const existing = await this.fornecedoresRepository.findOne(id);
        if (!existing) {
            throw new common_1.NotFoundException('Fornecedor não encontrado');
        }
        await this.fornecedoresRepository.remove(id);
        return { deleted: true, id };
    }
};
exports.FornecedoresService = FornecedoresService;
exports.FornecedoresService = FornecedoresService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [fornecedores_repository_1.FornecedoresRepository])
], FornecedoresService);
//# sourceMappingURL=fornecedores.service.js.map