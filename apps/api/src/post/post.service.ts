import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  EditablePostListVisibility,
  GetEditablePostListQuery,
  GetEditablePostListResponse,
  GetEditablePostByIdResponse,
  GetPostByIdResponse,
  GetPostDraftIdResponse,
  SavePostMode,
  SavePostRequset,
  GetPostListQuery,
  SavePostResponse,
} from './post.dto.type';
import {
  Prisma,
  PostStatus,
  StorageFileStatus,
  StorageFileUsage,
  User,
  UserProvider,
  UserRole,
} from '../../generated/prisma/client.cjs';
import { extractPostStorageFileIdsFromMarkdown } from './post-markdown.util';

@Injectable()
export class PostService {
  constructor(private readonly prismaService: PrismaService) {}

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
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: filters.limit + 1,
      select: {
        id: true,
        tags: true,
        title: true,
        description: true,
        createdAt: true,
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
                createdAt: lastItem.createdAt,
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
        files: {
          where: {
            status: StorageFileStatus.ATTACHED,
          },
        },
      },
    });

    if (!rawPost || !rawPost.isPublic) {
      throw new NotFoundException('post not found');
    }

    const { author, files, ...post } = rawPost;
    const thumbnail = files.find(
      (file) =>
        file.usage === StorageFileUsage.THUMBNAIL &&
        file.status === StorageFileStatus.ATTACHED,
    );

    return {
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
  }

  async getEditablePostById(
    postId: number,
    userUnique: {
      username: string;
      provider: UserProvider;
    },
  ): Promise<GetEditablePostByIdResponse> {
    const user = await this.prismaService.user.findUnique({
      where: {
        username_provider: {
          username: userUnique.username,
          provider: userUnique.provider,
        },
      },
      select: {
        id: true,
        role: true,
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

    if (!post) {
      throw new NotFoundException('post not found');
    }

    this.assertEditablePostAccess({
      postAuthorId: post.authorId,
      user,
    });

    const { files, ...rest } = post;

    return {
      post: rest,
      files,
    };
  }

  async savePost(
    postId: number,
    postPayload: SavePostRequset,
    user: {
      username: string;
      provider: UserProvider;
      role: UserRole;
    },
  ): Promise<SavePostResponse> {
    const usedContentFileIds = extractPostStorageFileIdsFromMarkdown(
      postPayload.markdown,
      postId,
    );
    const now = new Date();

    return await this.prismaService.$transaction(async (tx) => {
      const existingPost = await tx.post.findUnique({
        where: {
          id: postId,
        },
        select: {
          id: true,
          authorId: true,
          isPublic: true,
          status: true,
          publishedAt: true,
        },
      });

      if (!existingPost) {
        throw new NotFoundException('post not found');
      }

      const editingUser = await tx.user.findUnique({
        where: {
          username_provider: {
            username: user.username,
            provider: user.provider,
          },
        },
        select: {
          id: true,
          role: true,
        },
      });

      this.assertEditablePostAccess({
        postAuthorId: existingPost.authorId,
        user: editingUser,
      });

      await this.assertReferencedFilesAreValid({
        tx,
        postId,
        thumbnailId: postPayload.thumbnailId ?? null,
        contentFileIds: usedContentFileIds,
      });

      const post = await tx.post.update({
        where: {
          id: postId,
        },
        data: {
          title: postPayload.title,
          description: postPayload.description,
          markdown: postPayload.markdown,
          tags: postPayload.tags,
          isPublic: this.resolvePostVisibility({
            saveMode: postPayload.saveMode,
            isPublic: postPayload.isPublic,
            existingIsPublic: existingPost.isPublic,
          }),
          status: this.resolvePostStatus({
            saveMode: postPayload.saveMode,
            isPublic: postPayload.isPublic,
          }),
          updatedAt: now,
          publishedAt: this.resolvePublishedAt({
            saveMode: postPayload.saveMode,
            isPublic: postPayload.isPublic,
            existingPublishedAt: existingPost.publishedAt,
            now,
          }),
        },
        select: {
          id: true,
          status: true,
          isPublic: true,
          updatedAt: true,
          publishedAt: true,
        },
      });

      await this.syncContentFileStates({
        tx,
        postId,
        usedContentFileIds,
        now,
      });
      await this.syncThumbnailFileStates({
        tx,
        postId,
        thumbnailId: postPayload.thumbnailId ?? null,
        now,
      });

      return {
        id: post.id,
        status: post.status,
        isPublic: post.isPublic,
        updatedAt: post.updatedAt.toISOString(),
        publishedAt: post.publishedAt?.toISOString() ?? null,
      };
    });
  }

  private async assertReferencedFilesAreValid(params: {
    tx: Prisma.TransactionClient;
    postId: number;
    thumbnailId: number | null;
    contentFileIds: number[];
  }) {
    const referencedFileIds = [
      ...params.contentFileIds,
      ...(params.thumbnailId === null ? [] : [params.thumbnailId]),
    ];

    if (referencedFileIds.length === 0) {
      return;
    }

    const files = await params.tx.storageFile.findMany({
      where: {
        id: {
          in: referencedFileIds,
        },
      },
      select: {
        id: true,
        postId: true,
        usage: true,
        status: true,
      },
    });

    const fileById = new Map(files.map((file) => [file.id, file]));

    for (const fileId of params.contentFileIds) {
      const file = fileById.get(fileId);

      if (
        !file ||
        file.postId !== params.postId ||
        file.usage !== StorageFileUsage.CONTENT ||
        file.status === StorageFileStatus.DELETED
      ) {
        throw new BadRequestException(`invalid content file: ${fileId}`);
      }
    }

    if (params.thumbnailId !== null) {
      const thumbnailFile = fileById.get(params.thumbnailId);

      if (
        !thumbnailFile ||
        thumbnailFile.postId !== params.postId ||
        thumbnailFile.usage !== StorageFileUsage.THUMBNAIL ||
        thumbnailFile.status === StorageFileStatus.DELETED
      ) {
        throw new BadRequestException(
          `invalid thumbnail file: ${params.thumbnailId}`,
        );
      }
    }
  }

  private async syncContentFileStates(params: {
    tx: Prisma.TransactionClient;
    postId: number;
    usedContentFileIds: number[];
    now: Date;
  }) {
    if (params.usedContentFileIds.length > 0) {
      await params.tx.storageFile.updateMany({
        where: {
          postId: params.postId,
          usage: StorageFileUsage.CONTENT,
          id: {
            in: params.usedContentFileIds,
          },
          status: {
            in: [
              StorageFileStatus.TEMP,
              StorageFileStatus.ATTACHED,
              StorageFileStatus.ORPHANED,
            ],
          },
        },
        data: {
          status: StorageFileStatus.ATTACHED,
          attachedAt: params.now,
          orphanedAt: null,
          deletedAt: null,
        },
      });
    }

    await params.tx.storageFile.updateMany({
      where: {
        postId: params.postId,
        usage: StorageFileUsage.CONTENT,
        status: {
          in: [StorageFileStatus.TEMP, StorageFileStatus.ATTACHED],
        },
        ...(params.usedContentFileIds.length > 0
          ? {
              id: {
                notIn: params.usedContentFileIds,
              },
            }
          : {}),
      },
      data: {
        status: StorageFileStatus.ORPHANED,
        orphanedAt: params.now,
      },
    });
  }

  private async syncThumbnailFileStates(params: {
    tx: Prisma.TransactionClient;
    postId: number;
    thumbnailId: number | null;
    now: Date;
  }) {
    if (params.thumbnailId !== null) {
      await params.tx.storageFile.updateMany({
        where: {
          id: params.thumbnailId,
          postId: params.postId,
          usage: StorageFileUsage.THUMBNAIL,
          status: {
            in: [
              StorageFileStatus.TEMP,
              StorageFileStatus.ATTACHED,
              StorageFileStatus.ORPHANED,
            ],
          },
        },
        data: {
          status: StorageFileStatus.ATTACHED,
          attachedAt: params.now,
          orphanedAt: null,
          deletedAt: null,
        },
      });
    }

    await params.tx.storageFile.updateMany({
      where: {
        postId: params.postId,
        usage: StorageFileUsage.THUMBNAIL,
        status: {
          in: [StorageFileStatus.TEMP, StorageFileStatus.ATTACHED],
        },
        ...(params.thumbnailId === null
          ? {}
          : {
              id: {
                not: params.thumbnailId,
              },
            }),
      },
      data: {
        status: StorageFileStatus.ORPHANED,
        orphanedAt: params.now,
      },
    });
  }

  private assertEditablePostAccess(params: {
    postAuthorId: number;
    user: {
      id: number;
      role: UserRole;
    } | null;
  }) {
    if (!params.user) {
      throw new NotFoundException('user not found');
    }

    if (
      params.user.id !== params.postAuthorId &&
      params.user.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('forbidden');
    }
  }

  private parsePostListQuery(query: GetPostListQuery) {
    const normalizedQuery = query.query?.trim() || null;
    const normalizedTag = query.tag?.trim() || null;

    return {
      limit: query.limit ?? 12,
      cursor: query.cursor?.trim() || null,
      query: normalizedQuery,
      tag: normalizedTag,
    };
  }

  private decodePostListCursor(cursor: string | null) {
    if (!cursor) {
      return null;
    }

    try {
      const decoded = Buffer.from(cursor, 'base64url').toString('utf8');
      const parsed = JSON.parse(decoded) as { createdAt?: string; id?: number };

      if (
        !parsed.createdAt ||
        typeof parsed.id !== 'number' ||
        Number.isNaN(new Date(parsed.createdAt).getTime())
      ) {
        throw new Error('invalid cursor');
      }

      return {
        createdAt: new Date(parsed.createdAt),
        id: parsed.id,
      };
    } catch {
      throw new BadRequestException('invalid cursor');
    }
  }

  private createPostListWhere(params: {
    query: string | null;
    tag: string | null;
    cursor: {
      createdAt: Date;
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
      const olderCreatedAtFilter: Prisma.PostWhereInput = {
        createdAt: {
          lt: params.cursor.createdAt,
        },
      };

      const sameCreatedAtOlderIdFilter: Prisma.PostWhereInput = {
        AND: [
          {
            createdAt: params.cursor.createdAt,
          },
          {
            id: {
              lt: params.cursor.id,
            },
          },
        ],
      };

      return {
        AND: [
          where,
          {
            OR: [olderCreatedAtFilter, sameCreatedAtOlderIdFilter],
          },
        ],
      };
    }

    return where;
  }

  private encodePostListCursor(params: { createdAt: Date; id: number }) {
    return Buffer.from(
      JSON.stringify({
        createdAt: params.createdAt.toISOString(),
        id: params.id,
      }),
      'utf8',
    ).toString('base64url');
  }

  private parseEditablePostListQuery(query: GetEditablePostListQuery) {
    const visibility = this.parseEditablePostVisibility(query.visibility);
    const normalizedQuery = query.query?.trim() || null;
    const normalizedTag = query.tag?.trim() || null;

    return {
      limit: query.limit ?? 12,
      cursor: query.cursor?.trim() || null,
      query: normalizedQuery,
      visibility,
      tag: normalizedTag,
    };
  }

  private parseEditablePostVisibility(
    visibility?: EditablePostListVisibility,
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

  private resolvePostStatus(params: {
    saveMode: SavePostMode;
    isPublic: boolean;
  }) {
    if (params.saveMode === SavePostMode.AUTO) {
      return undefined;
    }

    return params.saveMode === SavePostMode.PUBLISH && params.isPublic
      ? PostStatus.PUBLISHED
      : PostStatus.DRAFT;
  }

  private resolvePostVisibility(params: {
    saveMode: SavePostMode;
    isPublic: boolean;
    existingIsPublic: boolean;
  }) {
    if (params.saveMode === SavePostMode.AUTO) {
      return params.existingIsPublic;
    }

    return params.saveMode === SavePostMode.PUBLISH && params.isPublic;
  }

  private resolvePublishedAt(params: {
    saveMode: SavePostMode;
    isPublic: boolean;
    existingPublishedAt: Date | null;
    now: Date;
  }) {
    if (params.saveMode === SavePostMode.AUTO) {
      return params.existingPublishedAt;
    }

    if (params.saveMode === SavePostMode.PUBLISH && params.isPublic) {
      return params.existingPublishedAt ?? params.now;
    }

    return null;
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

      return {
        AND: [
          where,
          {
            OR: [olderUpdatedAtFilter, sameUpdatedAtOlderIdFilter],
          },
        ],
      };
    }

    return where;
  }
}
