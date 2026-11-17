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
exports.TarefasService = void 0;
const common_1 = require("@nestjs/common");
const tarefas_repository_1 = require("./tarefas.repository");
let TarefasService = class TarefasService {
    tarefasRepository;
    constructor(tarefasRepository) {
        this.tarefasRepository = tarefasRepository;
    }
    toResponse(item) {
        return {
            id: Number(item.id),
            titulo: item.titulo,
            descricao: item.descricao ?? null,
            responsavel: item.responsavel ?? null,
            prioridade: item.prioridade ?? 'Média',
            status: item.status ?? 'Pendente',
            prazo: item.prazo ? new Date(item.prazo).toISOString().slice(0, 10) : null,
            categoria: item.categoria ?? null,
            criadoEm: new Date(item.criadoEm).toISOString(),
            atualizadoEm: new Date(item.atualizadoEm).toISOString(),
        };
    }
    async findAll() {
        const itens = await this.tarefasRepository.findAll();
        return itens.map((item) => this.toResponse(item));
    }
    async findOne(id) {
        const item = await this.tarefasRepository.findOne(id);
        if (!item) {
            throw new common_1.NotFoundException('Tarefa não encontrada');
        }
        return this.toResponse(item);
    }
    async create(dto) {
        const item = await this.tarefasRepository.create(dto);
        return this.toResponse(item);
    }
    async update(id, dto) {
        const existing = await this.tarefasRepository.findOne(id);
        if (!existing) {
            throw new common_1.NotFoundException('Tarefa não encontrada');
        }
        const item = await this.tarefasRepository.update(id, dto);
        return this.toResponse(item);
    }
    async remove(id) {
        const existing = await this.tarefasRepository.findOne(id);
        if (!existing) {
            throw new common_1.NotFoundException('Tarefa não encontrada');
        }
        await this.tarefasRepository.remove(id);
        return { deleted: true, id };
    }
};
exports.TarefasService = TarefasService;
exports.TarefasService = TarefasService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [tarefas_repository_1.TarefasRepository])
], TarefasService);
//# sourceMappingURL=tarefas.service.js.map