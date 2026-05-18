import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { StorageService } from './storage.service';
import type { UploadPostFileParams } from './storage.type';

describe('StorageService', () => {
  it('deletes the uploaded object when metadata persistence fails', async () => {
    const dbError = new Error('db create failed');
    const s3 = {
      send: jest.fn().mockResolvedValueOnce({}).mockResolvedValueOnce({}),
    };
    const config = {
      getOrThrow: jest.fn((key: string) => {
        if (key === 'MINIO_BUCKET') {
          return 'amaneta-log';
        }

        throw new Error(`unexpected config key: ${key}`);
      }),
      get: jest.fn(),
    };
    const prisma = {
      storageFile: {
        create: jest.fn().mockRejectedValue(dbError),
      },
    };
    const service = new StorageService(
      s3 as never,
      config as never,
      prisma as never,
    );

    jest
      .spyOn(service as never, 'assertWritablePost')
      .mockResolvedValue(undefined as never);
    jest
      .spyOn(service as never, 'ensureBucketExists')
      .mockResolvedValue(undefined as never);
    const uploadParams: UploadPostFileParams = {
      postId: 1,
      usage: 'CONTENT',
      file: {
        originalname: 'cover.png',
        mimetype: 'image/png',
        size: 128,
        buffer: Buffer.from('image'),
      },
      user: {
        sub: 'admin:CREDENTIALS',
        username: 'admin',
        provider: 'CREDENTIALS',
        role: 'ADMIN',
      },
    };

    await expect(service.uploadPostFile(uploadParams)).rejects.toBe(dbError);

    expect(s3.send).toHaveBeenNthCalledWith(1, expect.any(PutObjectCommand));
    expect(s3.send).toHaveBeenNthCalledWith(2, expect.any(DeleteObjectCommand));
  });
});
