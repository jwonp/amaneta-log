import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  EditablePostListVisibility,
  GetEditablePostListQuery,
  GetEditablePostListResponse,
  GetEditablePostByIdResponse,
  GetPostByIdResponse,
  GetPostDraftIdResponse,
  SavePostRequset,
  GetPostListQuery,
} from './post.dto.type';
import {
  Prisma,
  PostStatus,
  StorageFileStatus,
  StorageFileUsage,
  User,
  UserProvider,
} from '../../generated/prisma/client.cjs';
import { extractPostStorageStoredNamesFromMarkdown } from './post-markdown.util';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PostService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async getPostDraftId(params: {
    username: string;
    provider: UserProvider;
  }): Promise<GetPostDraftIdResponse> {
    const user: User | null = await this.prismaService.user.findUnique({
      where: {
        username_provider: {
          username: params.username,
          provider: params.provider,
        },
      },
    });

    if (!user) {
      throw new NotFoundException('user not found');
    }

    const post = await this.prismaService.post.create({
      data: {
        authorId: user.id,
      },
      select: {
        id: true,
        status: true,
      },
    });

    return {
      id: post.id,
      status: post.status,
    };
  }

  async getPosts(query: GetPostListQuery) {
    const filters = this.parsePostListQuery(query);
    const cursor = this.decodePostListCursor(filters.cursor);
    const where = this.createPostListWhere({
      query: filters.query,
      tag: filters.tag,
      cursor,
    });

    const posts = await this.prismaService.post.findMany({
      where,
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      take: filters.limit + 1,
      select: {
        id: true,
        tags: true,
        title: true,
        description: true,
        updatedAt: true,
        author: {
          select: {
            username: true,
          },
        },
        files: {
          where: {
            usage: StorageFileUsage.THUMBNAIL,
            status: StorageFileStatus.ATTACHED,
          },
          orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
          take: 1,
          select: {
            id: true,
          },
        },
      },
    });

    const hasNextPage = posts.length > filters.limit;
    const pageItems = hasNextPage ? posts.slice(0, filters.limit) : posts;
    const lastItem = pageItems.at(-1);

    return {
      items: pageItems.map((post) => ({
        id: post.id,
        tags: [...post.tags],
        title: post.title,
        description: post.description,
        updatedAt: post.updatedAt.toISOString(),
        author: post.author.username,
        thumbnailFileId: post.files[0]?.id ?? null,
      })),
      pageInfo: {
        nextCursor:
          hasNextPage && lastItem
            ? this.encodePostListCursor({
                updatedAt: lastItem.updatedAt,
                id: lastItem.id,
              })
            : null,
        hasNextPage,
      },
      appliedFilters: {
        query: filters.query,
        tag: filters.tag,
        limit: filters.limit,
      },
    };
  }

  async getEditablePosts(
    userUnique: Pick<User, 'username' | 'provider'>,
    query: GetEditablePostListQuery,
  ): Promise<GetEditablePostListResponse> {
    const user = await this.prismaService.user.findUnique({
      where: {
        username_provider: userUnique,
      },
      select: {
        id: true,
        username: true,
      },
    });

    if (!user) {
      throw new NotFoundException('user not found');
    }

    const filters = this.parseEditablePostListQuery(query);
    const cursor = this.decodeEditablePostListCursor(filters.cursor);
    const where = this.createEditablePostListWhere({
      authorId: user.id,
      query: filters.query,
      visibility: filters.visibility,
      tag: filters.tag,
      cursor,
    });

    const posts = await this.prismaService.post.findMany({
      where,
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      take: filters.limit + 1,
      select: {
        id: true,
        isPublic: true,
        tags: true,
        title: true,
        description: true,
        updatedAt: true,
        author: {
          select: {
            username: true,
          },
        },
        files: {
          where: {
            usage: StorageFileUsage.THUMBNAIL,
            status: StorageFileStatus.ATTACHED,
          },
          orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
          take: 1,
          select: {
            id: true,
          },
        },
      },
    });

    const hasNextPage = posts.length > filters.limit;
    const pageItems = hasNextPage ? posts.slice(0, filters.limit) : posts;
    const lastItem = pageItems.at(-1);

    return {
      items: pageItems.map((post) => ({
        id: post.id,
        isPublic: post.isPublic,
        tags: [...post.tags],
        title: post.title,
        description: post.description,
        updatedAt: post.updatedAt.toISOString(),
        author: post.author.username,
        thumbnailFileId: post.files[0]?.id ?? null,
      })),
      pageInfo: {
        nextCursor:
          hasNextPage && lastItem
            ? this.encodeEditablePostListCursor({
                updatedAt: lastItem.updatedAt,
                id: lastItem.id,
              })
            : null,
        hasNextPage,
      },
      appliedFilters: {
        query: filters.query,
        visibility: filters.visibility,
        tag: filters.tag,
        limit: filters.limit,
      },
    };
  }

  async getPostById(postId: number): Promise<GetPostByIdResponse> {
    const rawPost = await this.prismaService.post.findUnique({
      where: {
        id: postId,
      },
      include: {
        author: true,
        files: true,
      },
    });

    if (!rawPost || !rawPost.isPublic) {
      throw new NotFoundException('post not found');
    }

    const { author, files, ...post } = rawPost;
    const thumbnail = files.find((f) => f.usage === 'THUMBNAIL');

    const postResponse: GetPostByIdResponse = {
      post: {
        id: post.id,
        title: post.title,
        description: post.description,
        markdown: post.markdown,
        tags: post.tags,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        thumbnail: thumbnail?.kind,
      },
      author: { username: author.username, profileImage: author.profileImage },
      files: files.map(({ id, kind, storedName, mimeType }) => ({
        id,
        kind,
        storedName,
        mimeType,
      })),
    };

    return postResponse;
  }

  async getEditablePostById(
    postId: number,
    userUnique: {
      username: string;
      provider: UserProvider;
    },
  ) {
    const user = await this.prismaService.user.findUnique({
      where: {
        username_provider: {
          username: userUnique.username,
          provider: userUnique.provider,
        },
      },
      select: {
        id: true,
      },
    });

    const post = await this.prismaService.post.findUnique({
      where: {
        id: postId,
      },
      include: {
        files: true,
      },
    });
    console.log({ user, post });
    if (!user || post?.authorId !== user.id) {
      throw new UnauthorizedException('Not Allowed');
    }

    if (!post) {
      throw new NotFoundException('post not found');
    }

    const { files, ...rest } = post;
    const editablePostResponse: GetEditablePostByIdResponse = {
      post: rest,
      files,
    };

    return editablePostResponse;
  }

  async savePost(postId: number, postPayload: SavePostRequset) {
    const usedStoredNames = extractPostStorageStoredNamesFromMarkdown(
      postPayload.markdown,
      postId,
      this.config.getOrThrow<string>('MINIO_BUCKET'),
    );
    const now = new Date();

    return await this.prismaService.$transaction(async (tx) => {
      const existingPost = await tx.post.findUnique({
        where: {
          id: postId,
        },
        select: {
          id: true,
          publishedAt: true,
        },
      });

      if (!existingPost) {
        throw new NotFoundException('post not found');
      }

      const thumbnailId = postPayload.thumbnailId ?? null;
      const attachedAt = now;

      const post = await tx.post.update({
        where: {
          id: postId,
        },
        data: {
          title: postPayload.title,
          description: postPayload.description,
          markdown: postPayload.markdown,
          tags: postPayload.tags,
          isPublic: postPayload.isPublic,
          status: postPayload.isPublic
            ? PostStatus.PUBLISHED
            : PostStatus.DRAFT,
          updatedAt: now,
          publishedAt: postPayload.isPublic
            ? (existingPost.publishedAt ?? now)
            : null,
        },
        select: {
          id: true,
          status: true,
          title: true,
          description: true,
          markdown: true,
          tags: true,
          isPublic: true,
          publishedAt: true,
          updatedAt: true,
        },
      });

      if (usedStoredNames.length > 0) {
        await tx.storageFile.updateMany({
          where: {
            postId,
            usage: StorageFileUsage.CONTENT,
            status: StorageFileStatus.TEMP,
            storedName: {
              in: usedStoredNames,
            },
          },
          data: {
            status: StorageFileStatus.ATTACHED,
            attachedAt,
          },
        });
      }

      await tx.storageFile.updateMany({
        where: {
          postId,
          usage: StorageFileUsage.CONTENT,
          status: StorageFileStatus.TEMP,
          ...(usedStoredNames.length > 0
            ? {
                storedName: {
                  notIn: usedStoredNames,
                },
              }
            : {}),
        },
        data: {
          status: StorageFileStatus.ORPHANED,
        },
      });

      if (thumbnailId !== null) {
        await tx.storageFile.updateMany({
          where: {
            id: thumbnailId,
            postId,
            usage: StorageFileUsage.THUMBNAIL,
            status: StorageFileStatus.TEMP,
          },
          data: {
            status: StorageFileStatus.ATTACHED,
            attachedAt,
          },
        });
      }

      return post;
    });
  }

  private parsePostListQuery(query: GetPostListQuery) {
    const parsedLimit = Number.parseInt(query.limit ?? '12', 10);
    const limit = Number.isFinite(parsedLimit)
      ? Math.min(Math.max(parsedLimit, 1), 50)
      : 12;

    const normalizedQuery = query.query?.trim() || null;
    const normalizedTag = query.tag?.trim() || null;

    return {
      limit,
      cursor: query.cursor?.trim() || null,
      query: normalizedQuery,

      tag: normalizedTag,
    };
  }

  private decodePostListCursor(cursor: string | null) {
    return this.decodeEditablePostListCursor(cursor);
  }

  private createPostListWhere(params: {
    query: string | null;
    tag: string | null;
    cursor: {
      updatedAt: Date;
      id: number;
    } | null;
  }): Prisma.PostWhereInput {
    const where: Prisma.PostWhereInput = {
      isPublic: true,
      status: PostStatus.PUBLISHED,
    };

    if (params.query) {
      where.OR = [
        {
          title: {
            contains: params.query,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: params.query,
            mode: 'insensitive',
          },
        },
      ];
    }

    if (params.tag) {
      where.tags = {
        has: params.tag,
      };
    }

    if (params.cursor) {
      const olderUpdatedAtFilter: Prisma.PostWhereInput = {
        updatedAt: {
          lt: params.cursor.updatedAt,
        },
      };

      const sameUpdatedAtOlderIdFilter: Prisma.PostWhereInput = {
        AND: [
          {
            updatedAt: params.cursor.updatedAt,
          },
          {
            id: {
              lt: params.cursor.id,
            },
          },
        ],
      };

      const cursorFilter: Prisma.PostWhereInput = {
        OR: [olderUpdatedAtFilter, sameUpdatedAtOlderIdFilter],
      };

      return {
        AND: [where, cursorFilter],
      };
    }

    return where;
  }

  private encodePostListCursor(params: { updatedAt: Date; id: number }) {
    return this.encodeEditablePostListCursor(params);
  }

  private parseEditablePostListQuery(query: GetEditablePostListQuery) {
    const parsedLimit = Number.parseInt(query.limit ?? '12', 10);
    const limit = Number.isFinite(parsedLimit)
      ? Math.min(Math.max(parsedLimit, 1), 50)
      : 12;
    const visibility = this.parseEditablePostVisibility(query.visibility);
    const normalizedQuery = query.query?.trim() || null;
    const normalizedTag = query.tag?.trim() || null;

    return {
      limit,
      cursor: query.cursor?.trim() || null,
      query: normalizedQuery,
      visibility,
      tag: normalizedTag,
    };
  }

  private parseEditablePostVisibility(
    visibility?: string,
  ): EditablePostListVisibility {
    if (!visibility || visibility === 'all') {
      return 'all';
    }

    if (visibility === 'public' || visibility === 'draft') {
      return visibility;
    }

    throw new BadRequestException('invalid visibility filter');
  }

  private decodeEditablePostListCursor(cursor: string | null) {
    if (!cursor) {
      return null;
    }

    try {
      const decoded = Buffer.from(cursor, 'base64url').toString('utf8');
      const parsed = JSON.parse(decoded) as { updatedAt?: string; id?: number };

      if (
        !parsed.updatedAt ||
        typeof parsed.id !== 'number' ||
        Number.isNaN(new Date(parsed.updatedAt).getTime())
      ) {
        throw new Error('invalid cursor');
      }

      return {
        updatedAt: new Date(parsed.updatedAt),
        id: parsed.id,
      };
    } catch {
      throw new BadRequestException('invalid cursor');
    }
  }

  private encodeEditablePostListCursor(params: {
    updatedAt: Date;
    id: number;
  }) {
    return Buffer.from(
      JSON.stringify({
        updatedAt: params.updatedAt.toISOString(),
        id: params.id,
      }),
      'utf8',
    ).toString('base64url');
  }

  private createEditablePostListWhere(params: {
    authorId: number;
    query: string | null;
    visibility: EditablePostListVisibility;
    tag: string | null;
    cursor: {
      updatedAt: Date;
      id: number;
    } | null;
  }): Prisma.PostWhereInput {
    const where: Prisma.PostWhereInput = {
      authorId: params.authorId,
      status: {
        not: PostStatus.DELETED,
      },
    };

    if (params.visibility === 'public') {
      where.isPublic = true;
    }

    if (params.visibility === 'draft') {
      where.isPublic = false;
    }

    if (params.query) {
      where.OR = [
        {
          title: {
            contains: params.query,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: params.query,
            mode: 'insensitive',
          },
        },
      ];
    }

    if (params.tag) {
      where.tags = {
        has: params.tag,
      };
    }

    if (params.cursor) {
      const olderUpdatedAtFilter: Prisma.PostWhereInput = {
        updatedAt: {
          lt: params.cursor.updatedAt,
        },
      };

      const sameUpdatedAtOlderIdFilter: Prisma.PostWhereInput = {
        AND: [
          {
            updatedAt: params.cursor.updatedAt,
          },
          {
            id: {
              lt: params.cursor.id,
            },
          },
        ],
      };

      const cursorFilter: Prisma.PostWhereInput = {
        OR: [olderUpdatedAtFilter, sameUpdatedAtOlderIdFilter],
      };

      return {
        AND: [where, cursorFilter],
      };
    }

    return where;
  }
}
