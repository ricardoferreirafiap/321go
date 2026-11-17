import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CountsController } from './counts.controller';
import { CountsService } from './counts.service';

@Module({
  imports: [PrismaModule],
  controllers: [CountsController],
  providers: [CountsService],
})
export class CountsModule {}