"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const path = __importStar(require("path"));
const prisma_module_1 = require("./prisma/prisma.module");
const health_module_1 = require("./health/health.module");
const financeiro_module_1 = require("./financeiro/financeiro.module");
const clientes_module_1 = require("./clientes/clientes.module");
const leads_module_1 = require("./leads/leads.module");
const fornecedores_module_1 = require("./fornecedores/fornecedores.module");
const funcionarios_module_1 = require("./funcionarios/funcionarios.module");
const produtos_module_1 = require("./produtos/produtos.module");
const tarefas_module_1 = require("./tarefas/tarefas.module");
const orcamentos_module_1 = require("./orcamentos/orcamentos.module");
const counts_module_1 = require("./counts/counts.module");
const ai_module_1 = require("./ai/ai.module");
const request_logging_middleware_1 = require("./common/middleware/request-logging.middleware");
const envFilePath = [
    path.resolve(__dirname, '../../../.env'),
    path.resolve(__dirname, '../../../.env.local'),
    '.env',
    '.env.local',
];
let AppModule = class AppModule {
    configure(consumer) {
        consumer.apply(request_logging_middleware_1.RequestLoggingMiddleware).forRoutes('*');
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath,
            }),
            prisma_module_1.PrismaModule,
            health_module_1.HealthModule,
            financeiro_module_1.FinanceiroModule,
            clientes_module_1.ClientesModule,
            leads_module_1.LeadsModule,
            fornecedores_module_1.FornecedoresModule,
            funcionarios_module_1.FuncionariosModule,
            produtos_module_1.ProdutosModule,
            tarefas_module_1.TarefasModule,
            orcamentos_module_1.OrcamentosModule,
            counts_module_1.CountsModule,
            ai_module_1.AiModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map