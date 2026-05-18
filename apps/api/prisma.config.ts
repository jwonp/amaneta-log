import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';
import { existsSync } from 'node:fs';

type Env = {
  DATABASE_URL: string;
  PRISMA_DATABASE_URL?: string;
};

const isRunningInDocker = existsSync('/.dockerenv');
const prismaDatabaseUrl = isRunningInDocker
  ? env<Env>('DATABASE_URL')
  : process.env.PRISMA_DATABASE_URL ?? env<Env>('DATABASE_URL');

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: prismaDatabaseUrl,
  },
});
