import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import { S3_CLIENT } from './s3.provider';
import {
  StorageFileKind,
  StorageFileStatus,
  StorageFileUsage,
} from '@/generated/prisma/client.cjs';
import { PrismaService } from '../prisma/prisma.service';
import type {
  UploadPostFileParams,
  UploadPostFileResponse,
} from './storage.type';

@Injectable()
export class StorageService {
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

    await this.assertWritablePost(params);
    await this.ensureBucketExists(bucket);

    const storedName = this.createStoredName(params.file.originalname);
    const objectKey = this.createPostFileObjectKey({
      postId: params.postId,
      usage,
      storedName,
    });
    const publicUrl = this.createPublicUrl(objectKey);

    await this.s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: objectKey,
        Body: params.file.buffer,
        ContentType: params.file.mimetype,
        ContentLength: params.file.size,
      }),
    );

    const storageFile = await this.prisma.storageFile.create({
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
      publicUrl,
    };
  }

  private async assertWritablePost(params: UploadPostFileParams) {
    const post = await this.prisma.post.findUnique({
      where: {
        id: params.postId,
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

    if (!post) {
      throw new NotFoundException('post not found');
    }

    const isAuthor =
      post.author.username === params.user.username &&
      post.author.provider === params.user.provider;

    if (!isAuthor && params.user.role !== 'ADMIN') {
      throw new ForbiddenException('forbidden');
    }
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

  private createPublicUrl(objectKey: string) {
    const publicUrl = this.config.getOrThrow<string>('MINIO_PUBLIC_URL');
    const bucket = this.config.getOrThrow<string>('MINIO_BUCKET');

    return `${publicUrl}/${bucket}/${objectKey}`;
  }

  private async ensureBucketExists(bucket: string) {
    try {
      await this.s3.send(
        new HeadBucketCommand({
          Bucket: bucket,
        }),
      );
    } catch {
      // 여기서는 단순화를 위해 bucket이 없으면 에러를 그대로 던지지 않고,
      // 운영에서는 CreateBucketCommand로 생성하거나, 앱 시작 시 bucket을 미리 만들어두는 것을 추천.
      throw new Error(`MinIO bucket does not exist: ${bucket}`);
    }
  }
}
