import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '../../generated/prisma/client.cjs';
import { SaveUserResponse } from './user.dto.type';
import { PrismaTransactionClient } from '../prisma/prisma.type';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  public async saveUser(
    userPayload: Omit<User, 'id' | 'createdAt' | 'updatedAt'>,
    tx?: PrismaTransactionClient,
  ): Promise<SaveUserResponse> {
    const client = tx ?? this.prisma;

    const user = await client.user.create({
      data: userPayload,
    });

    return {
      username: user.username,
      name: user.name,
      email: user.email,
      profileImage: user.profileImage,
      role: user.role,
      createdAt: user.createdAt,
    };
  }
}
