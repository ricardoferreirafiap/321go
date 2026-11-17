import { Controller, Get } from '@nestjs/common';
import { CountsService } from './counts.service';

@Controller('counts')
export class CountsController {
  constructor(private readonly countsService: CountsService) {}

  @Get()
  getCounts() {
    return this.countsService.getCounts();
  }
}

