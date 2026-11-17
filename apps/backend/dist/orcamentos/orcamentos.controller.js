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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrcamentosController = void 0;
const common_1 = require("@nestjs/common");
const orcamentos_service_1 = require("./orcamentos.service");
const create_orcamento_dto_1 = require("./dto/create-orcamento.dto");
const update_orcamento_dto_1 = require("./dto/update-orcamento.dto");
let OrcamentosController = class OrcamentosController {
    orcamentosService;
    constructor(orcamentosService) {
        this.orcamentosService = orcamentosService;
    }
    findAll() {
        return this.orcamentosService.findAll();
    }
    findByNumero(numero) {
        return this.orcamentosService.findByNumero(numero);
    }
    findByPublicToken(publicToken) {
        return this.orcamentosService.findByPublicToken(publicToken);
    }
    findOne(id) {
        return this.orcamentosService.findOne(id);
    }
    create(dto) {
        return this.orcamentosService.create(dto);
    }
    update(id, dto) {
        return this.orcamentosService.update(id, dto);
    }
    remove(id) {
        return this.orcamentosService.remove(id);
    }
};
exports.OrcamentosController = OrcamentosController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], OrcamentosController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('numero/:numero'),
    __param(0, (0, common_1.Param)('numero')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], OrcamentosController.prototype, "findByNumero", null);
__decorate([
    (0, common_1.Get)('public/:publicToken'),
    __param(0, (0, common_1.Param)('publicToken')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], OrcamentosController.prototype, "findByPublicToken", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], OrcamentosController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_orcamento_dto_1.CreateOrcamentoDto]),
    __metadata("design:returntype", void 0)
], OrcamentosController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_orcamento_dto_1.UpdateOrcamentoDto]),
    __metadata("design:returntype", void 0)
], OrcamentosController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], OrcamentosController.prototype, "remove", null);
exports.OrcamentosController = OrcamentosController = __decorate([
    (0, common_1.Controller)('orcamentos'),
    __metadata("design:paramtypes", [orcamentos_service_1.OrcamentosService])
], OrcamentosController);
//# sourceMappingURL=orcamentos.controller.js.map