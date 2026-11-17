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
exports.ProdutosService = void 0;
const common_1 = require("@nestjs/common");
const produtos_repository_1 = require("./produtos.repository");
let ProdutosService = class ProdutosService {
    produtosRepository;
    constructor(produtosRepository) {
        this.produtosRepository = produtosRepository;
    }
    toResponse(item) {
        return {
            id: Number(item.id),
            nome: item.nome,
            codigo: item.codigo ?? null,
            categoria: item.categoria ?? null,
            preco: Number(item.preco),
            fornecedor: item.fornecedor ?? null,
            operadora: item.operadora ?? null,
            unidade: item.unidade ?? 'un',
            status: item.status ?? 'Ativo',
            criadoEm: new Date(item.criadoEm).toISOString(),
            atualizadoEm: new Date(item.atualizadoEm).toISOString(),
        };
    }
    async findAll() {
        const itens = await this.produtosRepository.findAll();
        return itens.map((item) => this.toResponse(item));
    }
    async findOne(id) {
        const item = await this.produtosRepository.findOne(id);
        if (!item) {
            throw new common_1.NotFoundException('Produto não encontrado');
        }
        return this.toResponse(item);
    }
    async create(dto) {
        const item = await this.produtosRepository.create(dto);
        return this.toResponse(item);
    }
    async update(id, dto) {
        const existing = await this.produtosRepository.findOne(id);
        if (!existing) {
            throw new common_1.NotFoundException('Produto não encontrado');
        }
        const item = await this.produtosRepository.update(id, dto);
        return this.toResponse(item);
    }
    async remove(id) {
        const existing = await this.produtosRepository.findOne(id);
        if (!existing) {
            throw new common_1.NotFoundException('Produto não encontrado');
        }
        await this.produtosRepository.remove(id);
        return { deleted: true, id };
    }
};
exports.ProdutosService = ProdutosService;
exports.ProdutosService = ProdutosService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [produtos_repository_1.ProdutosRepository])
], ProdutosService);
//# sourceMappingURL=produtos.service.js.map