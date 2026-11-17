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
exports.FuncionariosService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const funcionarios_repository_1 = require("./funcionarios.repository");
let FuncionariosService = class FuncionariosService {
    funcionariosRepository;
    constructor(funcionariosRepository) {
        this.funcionariosRepository = funcionariosRepository;
    }
    formatDate(value) {
        if (!value) {
            return '';
        }
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString();
    }
    isSchemaDriftError(error) {
        return (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
            (error.code === 'P2021' || error.code === 'P2022'));
    }
    toResponse(item) {
        return {
            id: Number(item.id),
            name: item.nome,
            role: item.cargo ?? null,
            department: item.departamento ?? null,
            status: item.status ?? 'Ativo',
            initials: item.iniciais ?? null,
            accessLevel: item.nivelAcesso ?? 'Agente',
            email: item.email,
            saudacoes: item.saudacoes ?? null,
            photo: item.fotoUrl ?? null,
            criadoEm: this.formatDate(item.criadoEm),
            atualizadoEm: this.formatDate(item.atualizadoEm),
        };
    }
    async findAll() {
        try {
            const itens = await this.funcionariosRepository.findAll();
            return itens.map((item) => this.toResponse(item));
        }
        catch (error) {
            if (this.isSchemaDriftError(error)) {
                return [];
            }
            throw error;
        }
    }
    async findOne(id) {
        const item = await this.funcionariosRepository.findOne(id);
        if (!item) {
            throw new common_1.NotFoundException('Funcionário não encontrado');
        }
        return this.toResponse(item);
    }
    async create(dto) {
        const item = await this.funcionariosRepository.create(dto);
        return this.toResponse(item);
    }
    async update(id, dto) {
        const existing = await this.funcionariosRepository.findOne(id);
        if (!existing) {
            throw new common_1.NotFoundException('Funcionário não encontrado');
        }
        const item = await this.funcionariosRepository.update(id, dto);
        return this.toResponse(item);
    }
    async remove(id) {
        const existing = await this.funcionariosRepository.findOne(id);
        if (!existing) {
            throw new common_1.NotFoundException('Funcionário não encontrado');
        }
        await this.funcionariosRepository.remove(id);
        return { deleted: true, id };
    }
    async login(email, password) {
        const funcionario = await this.funcionariosRepository.findByEmail(email);
        if (!funcionario) {
            throw new common_1.UnauthorizedException('Credenciais inválidas');
        }
        if (!funcionario.senhaHash || funcionario.senhaHash !== password) {
            throw new common_1.UnauthorizedException('Credenciais inválidas');
        }
        return {
            message: 'Login realizado com sucesso.',
            accessToken: `demo-token-${Date.now()}`,
            funcionario: this.toResponse(funcionario),
        };
    }
};
exports.FuncionariosService = FuncionariosService;
exports.FuncionariosService = FuncionariosService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [funcionarios_repository_1.FuncionariosRepository])
], FuncionariosService);
//# sourceMappingURL=funcionarios.service.js.map