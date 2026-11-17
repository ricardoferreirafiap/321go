import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthFuncionariosController } from './auth-funcionarios.controller';
import { FuncionariosController } from './funcionarios.controller';
import { FuncionariosRepository } from './funcionarios.repository';
import { FuncionariosService } from './funcionarios.service';

@Module({
  imports: [PrismaModule],
  controllers: [FuncionariosController, AuthFuncionariosController],
  providers: [FuncionariosService, FuncionariosRepository],
  exports: [FuncionariosService],
})
export class FuncionariosModule {}

