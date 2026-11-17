import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TarefasController } from './tarefas.controller';
import { TarefasRepository } from './tarefas.repository';
import { TarefasService } from './tarefas.service';

@Module({
  imports: [PrismaModule],
  controllers: [TarefasController],
  providers: [TarefasService, TarefasRepository],
  exports: [TarefasService],
})
export class TarefasModule {}

