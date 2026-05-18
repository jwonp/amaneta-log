// apps/api/src/auth/roles.decorator.ts
import { UserRole } from '@/generated/prisma/client.cjs';
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: UserRole[]) => {
  return SetMetadata(ROLES_KEY, roles);
};
