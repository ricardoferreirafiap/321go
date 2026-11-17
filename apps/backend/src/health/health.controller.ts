import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  getHealth() {
    return {
      ok: true,
      service: '321go-backend',
      environment: process.env.NODE_ENV || 'development',
    };
  }
}

