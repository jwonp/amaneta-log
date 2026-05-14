import { UserRole } from '../../generated/prisma/enums.cjs';

export interface SaveUserResponse {
  username: string;
  name: string;
  email: string;
  profileImage: string | null;
  role: UserRole;
  createdAt: Date;
}
