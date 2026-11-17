import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ProdutosController } from './produtos.controller';
import { ProdutosRepository } from './produtos.repository';
import { ProdutosService } from './produtos.service';

@Module({
  imports: [PrismaModule],
  controllers: [ProdutosController],
  providers: [ProdutosService, ProdutosRepository],
  exports: [ProdutosService],
})
export class ProdutosModule {}

