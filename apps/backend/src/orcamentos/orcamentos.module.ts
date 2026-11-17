import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { OrcamentosController } from './orcamentos.controller';
import { OrcamentosRepository } from './orcamentos.repository';
import { OrcamentosService } from './orcamentos.service';

@Module({
  imports: [PrismaModule],
  controllers: [OrcamentosController],
  providers: [OrcamentosService, OrcamentosRepository],
})
export class OrcamentosModule {}

