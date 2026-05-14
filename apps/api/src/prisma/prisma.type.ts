import { PrismaService } from '../prisma/prisma.service';

export type PrismaTransactionClient = Parameters<
  Parameters<PrismaService['$transaction']>[0]
>[0];
