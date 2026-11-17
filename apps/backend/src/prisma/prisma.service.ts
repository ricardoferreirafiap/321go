import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

function resolveDatabaseUrl(): string {
  const env = process.env;
  const value =
    env.DATABASE_URL ||
    env.POSTGRES_PRISMA_URL ||
    env.POSTGRES_URL_NON_POOLING ||
    env.POSTGRES_URL ||
    env.POSTGRESQL_URL ||
    env.NEON_DATABASE_URL;

  if (!value || !value.trim()) {
    throw new Error(
      'DATABASE_URL ausente. Defina DATABASE_URL (ou POSTGRES_URL/POSTGRES_PRISMA_URL) no ambiente do backend.',
    );
  }

  return value.trim();
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const adapter = new PrismaPg({
      connectionString: resolveDatabaseUrl(),
    });

    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}