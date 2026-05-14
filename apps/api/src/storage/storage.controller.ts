import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from './storage.service';
import type { UploadedMemoryFile } from './storage.type';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/auth.type';

type UploadPostFileBody = {
  usage?: 'CONTENT' | 'THUMBNAIL';
};

@Controller('posts')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post(':postId/files')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadPostFile(
    @Param('postId', ParseIntPipe) postId: number,
    @Body() body: UploadPostFileBody,
    @UploadedFile() file: UploadedMemoryFile,
    @Req() request: AuthenticatedRequest,
  ) {
    return await this.storageService.uploadPostFile({
      postId,
      usage: body.usage ?? 'CONTENT',
      file,
      user: request.user,
    });
  }
}
