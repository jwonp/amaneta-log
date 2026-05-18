import { User } from '@/generated/prisma/client.cjs';

export type UserUnique = Pick<User, 'username' | 'provider'>;
