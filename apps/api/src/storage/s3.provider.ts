import { S3Client } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';

export const S3_CLIENT = Symbol('S3_CLIENT');

export const s3Provider = {
  provide: S3_CLIENT,
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    const endpoint = config.getOrThrow<string>('MINIO_ENDPOINT');
    const port = config.getOrThrow<string>('MINIO_PORT');
    const useSsl = config.get<string>('MINIO_USE_SSL') === 'true';

    const protocol = useSsl ? 'https' : 'http';

    return new S3Client({
      region: 'ap-northeast-2',
      endpoint: `${protocol}://${endpoint}:${port}`,
      forcePathStyle: true,
      credentials: {
        accessKeyId: config.getOrThrow<string>('MINIO_ROOT_USER'),
        secretAccessKey: config.getOrThrow<string>('MINIO_ROOT_PASSWORD'),
      },
    });
  },
};
