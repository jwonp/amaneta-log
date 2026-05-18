import { Module } from '@nestjs/common';
import { s3Provider } from './s3.provider';
import { StorageService } from './storage.service';
import { StorageController } from './storage.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [PrismaModule],
  providers: [s3Provider, StorageService, JwtService],
  exports: [s3Provider, StorageService],
  controllers: [StorageController],
})
export class StorageModule {}
