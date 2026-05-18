/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ForbiddenException } from '@nestjs/common';
import {
  PostStatus,
  StorageFileStatus,
  StorageFileUsage,
} from '../../generated/prisma/client.cjs';
import { PostService } from './post.service';

describe('PostService', () => {
  it('orphans removed content files and replaced thumbnails while attaching referenced files', async () => {
    const updateMany = jest.fn(
      (): Promise<{ count: number }> => Promise.resolve({ count: 1 }),
    );
    const tx = {
      post: {
        findUnique: jest.fn().mockResolvedValue({
          id: 1,
          authorId: 10,
          publishedAt: null,
        }),
        update: jest.fn().mockResolvedValue({
          id: 1,
          status: PostStatus.DRAFT,
          isPublic: false,
          updatedAt: new Date('2026-05-18T12:00:00.000Z'),
          publishedAt: null,
        }),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 10,
          role: 'ADMIN',
        }),
      },
      storageFile: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 101,
            postId: 1,
            usage: StorageFileUsage.CONTENT,
            status: StorageFileStatus.TEMP,
          },
          {
            id: 202,
            postId: 1,
            usage: StorageFileUsage.THUMBNAIL,
            status: StorageFileStatus.TEMP,
          },
        ]),
        updateMany,
      },
    };

    const prismaService = {
      $transaction: jest.fn(
        async (
          callback: (client: typeof tx) => Promise<unknown>,
        ): Promise<unknown> => await callback(tx),
      ),
    };
    const service = new PostService(prismaService as never);

    await service.savePost(
      1,
      {
        title: 'draft',
        description: 'desc',
        markdown: '![cover](/api/storage/1/files/101)',
        tags: ['tag'],
        isPublic: false,
        thumbnailId: 202,
      },
      {
        username: 'admin',
        provider: 'CREDENTIALS',
        role: 'ADMIN',
      },
    );

    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          usage: StorageFileUsage.CONTENT,
          id: {
            in: [101],
          },
        }),
        data: expect.objectContaining({
          status: StorageFileStatus.ATTACHED,
          orphanedAt: null,
        }),
      }),
    );
    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          usage: StorageFileUsage.CONTENT,
          status: {
            in: [StorageFileStatus.TEMP, StorageFileStatus.ATTACHED],
          },
          id: {
            notIn: [101],
          },
        }),
        data: expect.objectContaining({
          status: StorageFileStatus.ORPHANED,
        }),
      }),
    );
    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          usage: StorageFileUsage.THUMBNAIL,
          id: 202,
        }),
        data: expect.objectContaining({
          status: StorageFileStatus.ATTACHED,
          orphanedAt: null,
        }),
      }),
    );
    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          usage: StorageFileUsage.THUMBNAIL,
          status: {
            in: [StorageFileStatus.TEMP, StorageFileStatus.ATTACHED],
          },
          id: {
            not: 202,
          },
        }),
        data: expect.objectContaining({
          status: StorageFileStatus.ORPHANED,
        }),
      }),
    );
  });

  it('rejects saving a post when the user is not the author or an admin', async () => {
    const tx = {
      post: {
        findUnique: jest.fn().mockResolvedValue({
          id: 1,
          authorId: 10,
          publishedAt: null,
        }),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 11,
          role: 'USER',
        }),
      },
    };

    const prismaService = {
      $transaction: jest.fn(
        async (
          callback: (client: typeof tx) => Promise<unknown>,
        ): Promise<unknown> => await callback(tx),
      ),
    };
    const service = new PostService(prismaService as never);

    await expect(
      service.savePost(
        1,
        {
          title: 'draft',
          markdown: '',
          tags: [],
          isPublic: false,
        },
        {
          username: 'user',
          provider: 'CREDENTIALS',
          role: 'USER',
        },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
