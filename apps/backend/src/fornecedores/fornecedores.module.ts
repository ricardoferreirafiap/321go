import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { FornecedoresController } from './fornecedores.controller';
import { FornecedoresRepository } from './fornecedores.repository';
import { FornecedoresService } from './fornecedores.service';

@Module({
  imports: [PrismaModule],
  controllers: [FornecedoresController],
  providers: [FornecedoresService, FornecedoresRepository],
  exports: [FornecedoresService],
})
export class FornecedoresModule {}

