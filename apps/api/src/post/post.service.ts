import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  GetEditablePostByIdResponse,
  GetPostByIdResponse,
  GetPostDraftIdResponse,
  SavePostRequset,
} from './post.dto.type';
import {
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

  async getEditablePostById(postId: number) {
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
}
