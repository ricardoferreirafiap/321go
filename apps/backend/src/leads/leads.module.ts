import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { LeadsController } from './leads.controller';
import { LeadsRepository } from './leads.repository';
import { LeadsService } from './leads.service';

@Module({
  imports: [PrismaModule],
  controllers: [LeadsController],
  providers: [LeadsRepository, LeadsService],
})
export class LeadsModule {}

