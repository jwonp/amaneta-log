import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
  type GetObjectCommandOutput,
} from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import { Readable } from 'node:stream';
import { S3_CLIENT } from './s3.provider';
import {
  PostStatus,
  StorageFile,
  StorageFileKind,
  StorageFileStatus,
  StorageFileUsage,
  UserProvider,
  UserRole,
} from '../../generated/prisma/client.cjs';
import { PrismaService } from '../prisma/prisma.service';
import type {
  UploadPostFileParams,
  UploadPostFileResponse,
} from './storage.type';

const DEFAULT_CONTENT_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];
const DEFAULT_THUMBNAIL_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const DEFAULT_CONTENT_IMAGE_MAX_BYTES = 10 * 1024 * 1024;
const DEFAULT_THUMBNAIL_MAX_BYTES = 5 * 1024 * 1024;

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor(
    @Inject(S3_CLIENT)
    private readonly s3: S3Client,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async uploadPostFile(
    params: UploadPostFileParams,
  ): Promise<UploadPostFileResponse> {
    if (!params.file) {
      throw new BadRequestException('file is required');
    }

    const usage = this.parseUsage(params.usage);
    const kind = this.createStorageFileKind(params.file.mimetype);
    const bucket = this.config.getOrThrow<string>('MINIO_BUCKET');

    this.assertUploadConstraints({
      usage,
      mimeType: params.file.mimetype,
      size: params.file.size,
    });

    await this.assertWritablePost(params);
    await this.ensureBucketExists(bucket);

    const storedName = this.createStoredName(params.file.originalname);
    const objectKey = this.createPostFileObjectKey({
      postId: params.postId,
      usage,
      storedName,
    });

    await this.s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: objectKey,
        Body: params.file.buffer,
        ContentType: params.file.mimetype,
        ContentLength: params.file.size,
      }),
    );

    let storageFile: StorageFile;

    try {
      storageFile = await this.prisma.storageFile.create({
        data: {
          postId: params.postId,
          usage,
          kind,
          status: StorageFileStatus.TEMP,
          originalName: params.file.originalname,
          storedName,
          mimeType: params.file.mimetype,
          size: params.file.size,
        },
      });
    } catch (error) {
      try {
        await this.s3.send(
          new DeleteObjectCommand({
            Bucket: bucket,
            Key: objectKey,
          }),
        );
      } catch (cleanupError) {
        this.logger.error(
          `failed to delete uploaded object after storage metadata create error: ${objectKey}`,
          cleanupError instanceof Error ? cleanupError.stack : undefined,
        );
      }

      throw error;
    }

    return {
      id: storageFile.id,
      postId: storageFile.postId,
      usage: storageFile.usage,
      kind: storageFile.kind,
      status: storageFile.status,
      originalName: storageFile.originalName,
      storedName,
      mimeType: storageFile.mimeType,
      size: storageFile.size,
      attachedAt: storageFile.attachedAt,
      orphanedAt: storageFile.orphanedAt,
      deletedAt: storageFile.deletedAt,
    };
  }

  async getFile(
    postId: number,
    fileId: number,
    user?: {
      username: string;
      provider: UserProvider;
      role: UserRole;
    } | null,
  ) {
    const file = await this.prisma.storageFile.findUnique({
      where: {
        id: fileId,
      },
      select: {
        postId: true,
        status: true,
        usage: true,
        storedName: true,
        mimeType: true,
        size: true,
        updatedAt: true,
      },
    });

    if (
      !file ||
      file.postId !== postId ||
      file.status === StorageFileStatus.DELETED
    ) {
      throw new NotFoundException('file not found');
    }

    const post = await this.prisma.post.findUnique({
      where: {
        id: postId,
      },
      select: {
        author: {
          select: {
            username: true,
            provider: true,
          },
        },
        isPublic: true,
        status: true,
      },
    });

    if (!post) {
      throw new NotFoundException('file not found');
    }

    const canReadPublicFile =
      post.status === PostStatus.PUBLISHED &&
      post.isPublic &&
      file.status === StorageFileStatus.ATTACHED;

    const canReadEditableFile = user
      ? this.canAccessEditablePost({
          postAuthor: post.author,
          user,
        })
      : false;

    if (!canReadPublicFile && !canReadEditableFile) {
      throw new NotFoundException('file not found');
    }

    const bucket = this.config.getOrThrow<string>('MINIO_BUCKET');
    const objectKey = this.createPostFileObjectKey({
      postId,
      usage: file.usage,
      storedName: file.storedName,
    });
    const fileObject = await this.s3.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: objectKey,
      }),
    );

    return {
      stream: this.toReadableStream(fileObject.Body),
      mimeType: file.mimeType,
      size: file.size,
      cacheControl: canReadPublicFile
        ? 'public, max-age=31536000, immutable'
        : 'private, no-store',
      etag: this.createStorageFileETag({
        fileId,
        size: file.size,
        updatedAt: file.updatedAt,
      }),
    };
  }

  async cleanupOrphanedFiles(params: {
    retentionMs: number;
    batchSize: number;
  }) {
    const cutoff = new Date(Date.now() - params.retentionMs);
    const files = await this.prisma.storageFile.findMany({
      where: {
        status: StorageFileStatus.ORPHANED,
        orphanedAt: {
          lte: cutoff,
        },
      },
      orderBy: [
        {
          orphanedAt: 'asc',
        },
        {
          id: 'asc',
        },
      ],
      take: params.batchSize,
      select: {
        id: true,
        postId: true,
        usage: true,
        storedName: true,
      },
    });

    const bucket = this.config.getOrThrow<string>('MINIO_BUCKET');
    let deletedCount = 0;

    for (const file of files) {
      const objectKey = this.createPostFileObjectKey({
        postId: file.postId,
        usage: file.usage,
        storedName: file.storedName,
      });

      try {
        await this.s3.send(
          new DeleteObjectCommand({
            Bucket: bucket,
            Key: objectKey,
          }),
        );
        await this.prisma.storageFile.update({
          where: {
            id: file.id,
          },
          data: {
            status: StorageFileStatus.DELETED,
            deletedAt: new Date(),
          },
        });
        deletedCount += 1;
      } catch {
        continue;
      }
    }

    return {
      scannedCount: files.length,
      deletedCount,
    };
  }

  private assertUploadConstraints(params: {
    usage: StorageFileUsage;
    mimeType: string;
    size: number;
  }) {
    const allowedMimeTypes =
      params.usage === StorageFileUsage.THUMBNAIL
        ? this.readMimeTypeList(
            'STORAGE_UPLOAD_ALLOWED_THUMBNAIL_MIME_TYPES',
            DEFAULT_THUMBNAIL_MIME_TYPES,
          )
        : this.readMimeTypeList(
            'STORAGE_UPLOAD_ALLOWED_CONTENT_MIME_TYPES',
            DEFAULT_CONTENT_IMAGE_MIME_TYPES,
          );
    const maxBytes =
      params.usage === StorageFileUsage.THUMBNAIL
        ? this.readPositiveInteger(
            'STORAGE_UPLOAD_MAX_THUMBNAIL_BYTES',
            DEFAULT_THUMBNAIL_MAX_BYTES,
          )
        : this.readPositiveInteger(
            'STORAGE_UPLOAD_MAX_CONTENT_IMAGE_BYTES',
            DEFAULT_CONTENT_IMAGE_MAX_BYTES,
          );

    if (!allowedMimeTypes.includes(params.mimeType)) {
      throw new UnsupportedMediaTypeException('file mime type is not allowed');
    }

    if (params.size > maxBytes) {
      throw new PayloadTooLargeException('file size exceeds upload limit');
    }
  }

  private toReadableStream(body: GetObjectCommandOutput['Body']) {
    if (!body) {
      throw new NotFoundException('file object not found');
    }

    if (body instanceof Readable) {
      return body;
    }

    throw new Error('unsupported MinIO file stream type');
  }

  private createStorageFileETag(params: {
    fileId: number;
    size: number;
    updatedAt: Date;
  }) {
    return `"${params.fileId}-${params.size}-${params.updatedAt.getTime()}"`;
  }

  private async assertWritablePost(params: UploadPostFileParams) {
    const post = await this.findPostAuthor(params.postId);

    if (!post) {
      throw new NotFoundException('post not found');
    }

    if (
      !this.canAccessEditablePost({
        postAuthor: post.author,
        user: params.user,
      })
    ) {
      throw new ForbiddenException('forbidden');
    }
  }

  private async findPostAuthor(postId: number) {
    return await this.prisma.post.findUnique({
      where: {
        id: postId,
      },
      select: {
        author: {
          select: {
            username: true,
            provider: true,
          },
        },
      },
    });
  }

  private canAccessEditablePost(params: {
    postAuthor: {
      username: string;
      provider: UserProvider;
    };
    user: {
      username: string;
      provider: UserProvider;
      role: UserRole;
    };
  }) {
    const isAuthor =
      params.postAuthor.username === params.user.username &&
      params.postAuthor.provider === params.user.provider;

    return isAuthor || params.user.role === UserRole.ADMIN;
  }

  private parseUsage(usage: StorageFileUsage) {
    if (
      usage === StorageFileUsage.CONTENT ||
      usage === StorageFileUsage.THUMBNAIL
    ) {
      return usage;
    }

    throw new BadRequestException('invalid file usage');
  }

  private createStorageFileKind(mimeType: string) {
    if (mimeType.startsWith('image/')) {
      return StorageFileKind.IMAGE;
    }

    if (mimeType.startsWith('video/')) {
      return StorageFileKind.VIDEO;
    }

    return StorageFileKind.OTHER;
  }

  private createStoredName(originalName: string) {
    const extension = extname(originalName);
    return `${randomUUID()}${extension}`;
  }

  private createPostFileObjectKey(params: {
    postId: number;
    usage: 'CONTENT' | 'THUMBNAIL';
    storedName: string;
  }) {
    return `posts/${params.postId}/${params.usage.toLowerCase()}/${params.storedName}`;
  }

  private async ensureBucketExists(bucket: string) {
    try {
      await this.s3.send(
        new HeadBucketCommand({
          Bucket: bucket,
        }),
      );
    } catch {
      throw new Error(`MinIO bucket does not exist: ${bucket}`);
    }
  }

  private readMimeTypeList(key: string, fallback: string[]) {
    const value = this.config.get<string>(key);

    if (!value?.trim()) {
      return fallback;
    }

    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private readPositiveInteger(key: string, fallback: number) {
    const rawValue = this.config.get<string>(key);

    if (!rawValue) {
      return fallback;
    }

    const parsedValue = Number.parseInt(rawValue, 10);

    return Number.isFinite(parsedValue) && parsedValue > 0
      ? parsedValue
      : fallback;
  }
}
