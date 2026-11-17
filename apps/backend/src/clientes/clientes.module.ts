import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ClientesController } from './clientes.controller';
import { ClientesRepository } from './clientes.repository';
import { ClientesService } from './clientes.service';

@Module({
  imports: [PrismaModule],
  controllers: [ClientesController],
  providers: [ClientesService, ClientesRepository],
  exports: [ClientesService],
})
export class ClientesModule {}

