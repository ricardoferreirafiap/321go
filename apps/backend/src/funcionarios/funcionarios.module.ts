import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { FuncionariosController } from './funcionarios.controller';
import { FuncionariosRepository } from './funcionarios.repository';
import { FuncionariosService } from './funcionarios.service';

@Module({
  imports: [PrismaModule],
  controllers: [FuncionariosController],
  providers: [FuncionariosService, FuncionariosRepository],
  exports: [FuncionariosService],
})
export class FuncionariosModule {}

