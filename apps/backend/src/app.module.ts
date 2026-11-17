import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as path from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { FinanceiroModule } from './financeiro/financeiro.module';
import { ClientesModule } from './clientes/clientes.module';

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
  ],
})
export class AppModule {}