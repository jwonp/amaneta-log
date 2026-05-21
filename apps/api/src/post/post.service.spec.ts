/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ForbiddenException } from '@nestjs/common';
import {
  PostStatus,
  StorageFileStatus,
  StorageFileUsage,
} from '../../generated/prisma/client.cjs';
import { PostService } from './post.service';
import { SavePostMode } from './post.dto.type';

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
        saveMode: SavePostMode.DRAFT,
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
          saveMode: SavePostMode.DRAFT,
        },
        {
          username: 'user',
          provider: 'CREDENTIALS',
          role: 'USER',
        },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('preserves published status and publishedAt during autosave', async () => {
    const publishedAt = new Date('2026-05-17T10:00:00.000Z');
    const tx = {
      post: {
        findUnique: jest.fn().mockResolvedValue({
          id: 1,
          authorId: 10,
          isPublic: true,
          status: PostStatus.PUBLISHED,
          publishedAt,
        }),
        update: jest.fn().mockResolvedValue({
          id: 1,
          status: PostStatus.PUBLISHED,
          isPublic: true,
          updatedAt: new Date('2026-05-18T12:00:00.000Z'),
          publishedAt,
        }),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 10,
          role: 'ADMIN',
        }),
      },
      storageFile: {
        findMany: jest.fn().mockResolvedValue([]),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
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

    const response = await service.savePost(
      1,
      {
        title: 'published',
        description: 'desc',
        markdown: 'content',
        tags: ['tag'],
        isPublic: false,
        saveMode: SavePostMode.AUTO,
        thumbnailId: null,
      },
      {
        username: 'admin',
        provider: 'CREDENTIALS',
        role: 'ADMIN',
      },
    );

    expect(tx.post.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          isPublic: true,
          status: undefined,
          publishedAt,
        }),
      }),
    );
    expect(response.status).toBe(PostStatus.PUBLISHED);
    expect(response.isPublic).toBe(true);
    expect(response.publishedAt).toBe(publishedAt.toISOString());
  });

  it('excludes non-attached files from public post detail responses', async () => {
    const prismaService = {
      post: {
        findUnique: jest.fn().mockResolvedValue({
          id: 1,
          title: 'title',
          description: 'desc',
          markdown: 'content',
          tags: ['tag'],
          createdAt: new Date('2026-05-17T10:00:00.000Z'),
          updatedAt: new Date('2026-05-18T12:00:00.000Z'),
          isPublic: true,
          author: {
            username: 'author',
            profileImage: null,
          },
          files: [
            {
              id: 1,
              kind: 'IMAGE',
              storedName: 'attached.png',
              mimeType: 'image/png',
              usage: StorageFileUsage.CONTENT,
              status: StorageFileStatus.ATTACHED,
            },
          ],
        }),
      },
    };
    const service = new PostService(prismaService as never);

    const response = await service.getPostById(1);

    expect(prismaService.post.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          files: {
            where: {
              status: StorageFileStatus.ATTACHED,
            },
          },
        }),
      }),
    );
    expect(response.files).toEqual([
      {
        id: 1,
        kind: 'IMAGE',
        storedName: 'attached.png',
        mimeType: 'image/png',
      },
    ]);
  });

  it('orders public posts by createdAt descending and builds a createdAt cursor', async () => {
    const prismaService = {
      post: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 30,
            tags: ['alpha'],
            title: 'newest',
            description: 'desc',
            createdAt: new Date('2026-05-20T12:00:00.000Z'),
            updatedAt: new Date('2026-05-21T12:00:00.000Z'),
            author: {
              username: 'author',
            },
            files: [],
          },
          {
            id: 20,
            tags: ['beta'],
            title: 'older',
            description: 'desc',
            createdAt: new Date('2026-05-19T12:00:00.000Z'),
            updatedAt: new Date('2026-05-22T12:00:00.000Z'),
            author: {
              username: 'author',
            },
            files: [],
          },
        ]),
      },
    };
    const service = new PostService(prismaService as never);

    const response = await service.getPosts({ limit: 1 });

    expect(prismaService.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      }),
    );
    expect(response.items).toHaveLength(1);
    expect(response.items[0]?.id).toBe(30);
    expect(response.pageInfo.hasNextPage).toBe(true);
    expect(response.pageInfo.nextCursor).toBe(
      Buffer.from(
        JSON.stringify({
          createdAt: '2026-05-20T12:00:00.000Z',
          id: 30,
        }),
        'utf8',
      ).toString('base64url'),
    );
  });

  it('applies public post cursors using createdAt instead of updatedAt', async () => {
    const prismaService = {
      post: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    const service = new PostService(prismaService as never);
    const cursor = Buffer.from(
      JSON.stringify({
        createdAt: '2026-05-20T12:00:00.000Z',
        id: 30,
      }),
      'utf8',
    ).toString('base64url');

    await service.getPosts({ cursor });

    expect(prismaService.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          AND: [
            {
              isPublic: true,
              status: PostStatus.PUBLISHED,
            },
            {
              OR: [
                {
                  createdAt: {
                    lt: new Date('2026-05-20T12:00:00.000Z'),
                  },
                },
                {
                  AND: [
                    {
                      createdAt: new Date('2026-05-20T12:00:00.000Z'),
                    },
                    {
                      id: {
                        lt: 30,
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      }),
    );
  });
});
