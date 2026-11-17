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
exports.FuncionariosController = void 0;
const common_1 = require("@nestjs/common");
const create_funcionario_dto_1 = require("./dto/create-funcionario.dto");
const update_funcionario_dto_1 = require("./dto/update-funcionario.dto");
const funcionarios_service_1 = require("./funcionarios.service");
let FuncionariosController = class FuncionariosController {
    funcionariosService;
    constructor(funcionariosService) {
        this.funcionariosService = funcionariosService;
    }
    findAll() {
        return this.funcionariosService.findAll();
    }
    findOne(id) {
        return this.funcionariosService.findOne(id);
    }
    create(dto) {
        return this.funcionariosService.create(dto);
    }
    update(id, dto) {
        return this.funcionariosService.update(id, dto);
    }
    remove(id) {
        return this.funcionariosService.remove(id);
    }
    login(body) {
        return this.funcionariosService.login(body.email, body.password);
    }
};
exports.FuncionariosController = FuncionariosController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], FuncionariosController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], FuncionariosController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_funcionario_dto_1.CreateFuncionarioDto]),
    __metadata("design:returntype", void 0)
], FuncionariosController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_funcionario_dto_1.UpdateFuncionarioDto]),
    __metadata("design:returntype", void 0)
], FuncionariosController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], FuncionariosController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FuncionariosController.prototype, "login", null);
exports.FuncionariosController = FuncionariosController = __decorate([
    (0, common_1.Controller)('funcionarios'),
    __metadata("design:paramtypes", [funcionarios_service_1.FuncionariosService])
], FuncionariosController);
//# sourceMappingURL=funcionarios.controller.js.map