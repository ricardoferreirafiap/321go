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
exports.ClientesRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ClientesRepository = class ClientesRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    findAll() {
        return this.prisma.cliente.findMany({
            orderBy: { criadoEm: 'desc' },
        });
    }
    findOne(id) {
        return this.prisma.cliente.findUnique({
            where: { id: BigInt(id) },
        });
    }
    create(dto) {
        return this.prisma.cliente.create({
            data: {
                nome: dto.nome ?? null,
                sobrenome: dto.sobrenome ?? null,
                nomeCompleto: dto.nomeCompleto ?? null,
                email: dto.email ?? null,
                telefone: dto.telefone ?? null,
                cep: dto.cep ?? null,
                endereco: dto.endereco ?? null,
                numero: dto.numero ?? null,
                complemento: dto.complemento ?? null,
                cidade: dto.cidade ?? null,
                estado: dto.estado ?? null,
                status: dto.status ?? 'Ativo',
                cpfCnpj: dto.cpfCnpj ?? null,
                rg: dto.rg ?? null,
                dataNascimento: dto.dataNascimento ? new Date(dto.dataNascimento) : null,
                documentoNome: dto.documentoNome ?? null,
            },
        });
    }
    update(id, dto) {
        return this.prisma.cliente.update({
            where: { id: BigInt(id) },
            data: {
                nome: dto.nome ?? undefined,
                sobrenome: dto.sobrenome ?? undefined,
                nomeCompleto: dto.nomeCompleto ?? undefined,
                email: dto.email ?? undefined,
                telefone: dto.telefone ?? undefined,
                cep: dto.cep ?? undefined,
                endereco: dto.endereco ?? undefined,
                numero: dto.numero ?? undefined,
                complemento: dto.complemento ?? undefined,
                cidade: dto.cidade ?? undefined,
                estado: dto.estado ?? undefined,
                status: dto.status ?? undefined,
                cpfCnpj: dto.cpfCnpj ?? undefined,
                rg: dto.rg ?? undefined,
                dataNascimento: dto.dataNascimento ? new Date(dto.dataNascimento) : undefined,
                documentoNome: dto.documentoNome ?? undefined,
            },
        });
    }
    async remove(id) {
        const item = await this.findOne(id);
        if (!item) {
            return null;
        }
        await this.prisma.cliente.delete({
            where: { id: BigInt(id) },
        });
        return item;
    }
};
exports.ClientesRepository = ClientesRepository;
exports.ClientesRepository = ClientesRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ClientesRepository);
//# sourceMappingURL=clientes.repository.js.map