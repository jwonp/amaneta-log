import 'dotenv/config';
import { defineConfig } from 'prisma/config';
import { existsSync } from 'node:fs';

const isRunningInDocker = existsSync('/.dockerenv');

const databaseUrl = isRunningInDocker
  ? process.env.DATABASE_URL
  : (process.env.PRISMA_DATABASE_URL ?? process.env.DATABASE_URL);

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required for Prisma.');
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: databaseUrl,
  },
});
