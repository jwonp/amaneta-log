import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { StorageOrphanCleanupService } from './storage-orphan-cleanup.service';
import { StorageService } from './storage.service';

describe('StorageOrphanCleanupService', () => {
  it('forwards retention and batch env values to cleanup', async () => {
    const cleanupOrphanedFiles = jest.fn().mockResolvedValue({
      scannedCount: 1,
      deletedCount: 1,
    });

    const moduleRef = await Test.createTestingModule({
      providers: [
        StorageOrphanCleanupService,
        {
          provide: StorageService,
          useValue: {
            cleanupOrphanedFiles,
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              if (key === 'STORAGE_ORPHANED_RETENTION_MS') {
                return '7200000';
              }

              if (key === 'STORAGE_ORPHANED_CLEANUP_BATCH_SIZE') {
                return '25';
              }

              return undefined;
            },
          },
        },
      ],
    }).compile();

    const service = moduleRef.get(StorageOrphanCleanupService);

    await service.cleanupOrphanedFiles();

    expect(cleanupOrphanedFiles).toHaveBeenCalledWith({
      retentionMs: 7200000,
      batchSize: 25,
    });
  });
});
