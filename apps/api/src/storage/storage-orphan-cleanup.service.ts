import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { StorageService } from './storage.service';

const DEFAULT_CLEANUP_CRON = '0 * * * *';
const DEFAULT_RETENTION_MS = 24 * 60 * 60 * 1000;
const DEFAULT_BATCH_SIZE = 100;

@Injectable()
export class StorageOrphanCleanupService {
  private readonly logger = new Logger(StorageOrphanCleanupService.name);

  constructor(
    private readonly storageService: StorageService,
    private readonly configService: ConfigService,
  ) {}

  @Cron(process.env.STORAGE_ORPHANED_CLEANUP_CRON ?? DEFAULT_CLEANUP_CRON)
  async cleanupOrphanedFiles() {
    const result = await this.storageService.cleanupOrphanedFiles({
      retentionMs: this.readPositiveInteger(
        'STORAGE_ORPHANED_RETENTION_MS',
        DEFAULT_RETENTION_MS,
      ),
      batchSize: this.readPositiveInteger(
        'STORAGE_ORPHANED_CLEANUP_BATCH_SIZE',
        DEFAULT_BATCH_SIZE,
      ),
    });

    if (result.scannedCount === 0) {
      return;
    }

    this.logger.log(
      `orphan cleanup scanned=${result.scannedCount} deleted=${result.deletedCount}`,
    );
  }

  private readPositiveInteger(key: string, fallback: number) {
    const rawValue = this.configService.get<string>(key);

    if (!rawValue) {
      return fallback;
    }

    const parsedValue = Number.parseInt(rawValue, 10);

    return Number.isFinite(parsedValue) && parsedValue > 0
      ? parsedValue
      : fallback;
  }
}
