import { Module } from '@nestjs/common';
import { s3Provider } from './s3.provider';
import { StorageService } from './storage.service';
import { StorageController } from './storage.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtService } from '@nestjs/jwt';
import { StorageOrphanCleanupService } from './storage-orphan-cleanup.service';

@Module({
  imports: [PrismaModule],
  providers: [
    s3Provider,
    StorageService,
    StorageOrphanCleanupService,
    JwtService,
  ],
  exports: [s3Provider, StorageService],
  controllers: [StorageController],
})
export class StorageModule {}
