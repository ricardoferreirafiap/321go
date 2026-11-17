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
exports.ClientesService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const clientes_repository_1 = require("./clientes.repository");
let ClientesService = class ClientesService {
    clientesRepository;
    constructor(clientesRepository) {
        this.clientesRepository = clientesRepository;
    }
    toResponse(cliente) {
        const nomeCompleto = cliente.nomeCompleto ??
            ([cliente.nome, cliente.sobrenome].filter(Boolean).join(' ') || null);
        return {
            id: Number(cliente.id),
            nome: cliente.nome ?? null,
            sobrenome: cliente.sobrenome ?? null,
            nomeCompleto,
            email: cliente.email ?? null,
            telefone: cliente.telefone ?? null,
            cep: cliente.cep ?? null,
            endereco: cliente.endereco ?? null,
            numero: cliente.numero ?? null,
            complemento: cliente.complemento ?? null,
            cidade: cliente.cidade ?? null,
            estado: cliente.estado ?? null,
            status: cliente.status ?? 'Ativo',
            cpfCnpj: cliente.cpfCnpj ?? null,
            rg: cliente.rg ?? null,
            dataNascimento: cliente.dataNascimento ? new Date(cliente.dataNascimento).toISOString() : null,
            documentoNome: cliente.documentoNome ?? null,
            criadoEm: new Date(cliente.criadoEm).toISOString(),
            atualizadoEm: new Date(cliente.atualizadoEm).toISOString(),
        };
    }
    async findAll() {
        const clientes = await this.clientesRepository.findAll();
        return clientes.map((cliente) => this.toResponse(cliente));
    }
    async findOne(id) {
        const cliente = await this.clientesRepository.findOne(id);
        if (!cliente) {
            throw new common_1.NotFoundException('Cliente não encontrado');
        }
        return this.toResponse(cliente);
    }
    async create(dto) {
        const payload = {
            ...dto,
            nome: dto.nome?.trim(),
            sobrenome: dto.sobrenome?.trim() ?? null,
            nomeCompleto: dto.nomeCompleto?.trim() || null,
            email: dto.email?.trim() || null,
            telefone: dto.telefone?.trim() || null,
            cep: dto.cep?.trim() || null,
            endereco: dto.endereco?.trim() || null,
            numero: dto.numero?.trim() || null,
            complemento: dto.complemento?.trim() || null,
            cidade: dto.cidade?.trim() || null,
            estado: dto.estado?.trim().toUpperCase() || null,
            cpfCnpj: dto.cpfCnpj?.trim() || null,
            rg: dto.rg?.trim() || null,
            documentoNome: dto.documentoNome?.trim() || null,
        };
        try {
            const cliente = await this.clientesRepository.create(payload);
            return this.toResponse(cliente);
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new common_1.ConflictException('Já existe um cliente com este CPF/CNPJ.');
            }
            throw error;
        }
    }
    async update(id, dto) {
        const exists = await this.clientesRepository.findOne(id);
        if (!exists) {
            throw new common_1.NotFoundException('Cliente não encontrado');
        }
        const payload = {
            ...dto,
            nome: dto.nome?.trim(),
            sobrenome: dto.sobrenome?.trim() ?? undefined,
            nomeCompleto: dto.nomeCompleto?.trim() || undefined,
            email: dto.email?.trim() || undefined,
            telefone: dto.telefone?.trim() || undefined,
            cep: dto.cep?.trim() || undefined,
            endereco: dto.endereco?.trim() || undefined,
            numero: dto.numero?.trim() || undefined,
            complemento: dto.complemento?.trim() || undefined,
            cidade: dto.cidade?.trim() || undefined,
            estado: dto.estado?.trim().toUpperCase() || undefined,
            cpfCnpj: dto.cpfCnpj?.trim() || undefined,
            rg: dto.rg?.trim() || undefined,
            documentoNome: dto.documentoNome?.trim() || undefined,
        };
        try {
            const cliente = await this.clientesRepository.update(id, payload);
            return this.toResponse(cliente);
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new common_1.ConflictException('Já existe um cliente com este CPF/CNPJ.');
            }
            throw error;
        }
    }
    async remove(id) {
        const cliente = await this.clientesRepository.remove(id);
        if (!cliente) {
            throw new common_1.NotFoundException('Cliente não encontrado');
        }
        return { deleted: true, id: Number(cliente.id) };
    }
};
exports.ClientesService = ClientesService;
exports.ClientesService = ClientesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [clientes_repository_1.ClientesRepository])
], ClientesService);
//# sourceMappingURL=clientes.service.js.map