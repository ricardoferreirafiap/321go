import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as path from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { FinanceiroModule } from './financeiro/financeiro.module';
import { ClientesModule } from './clientes/clientes.module';
import { LeadsModule } from './leads/leads.module';
import { FornecedoresModule } from './fornecedores/fornecedores.module';
import { FuncionariosModule } from './funcionarios/funcionarios.module';
import { ProdutosModule } from './produtos/produtos.module';
import { TarefasModule } from './tarefas/tarefas.module';
import { OrcamentosModule } from './orcamentos/orcamentos.module';
import { CountsModule } from './counts/counts.module';
import { AiModule } from './ai/ai.module';
import { RequestLoggingMiddleware } from './common/middleware/request-logging.middleware';

const envFilePath = [
  path.resolve(__dirname, '../../../.env'),
  path.resolve(__dirname, '../../../.env.local'),
  '.env',
  '.env.local',
];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath,
    }),
    PrismaModule,
    HealthModule,
    FinanceiroModule,
    ClientesModule,
    LeadsModule,
    FornecedoresModule,
    FuncionariosModule,
    ProdutosModule,
    TarefasModule,
    OrcamentosModule,
    CountsModule,
    AiModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggingMiddleware).forRoutes('*');
  }
}