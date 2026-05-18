import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Res,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from './storage.service';
import type { UploadedMemoryFile } from './storage.type';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/auth.type';

type UploadPostFileBody = {
  usage?: 'CONTENT' | 'THUMBNAIL';
};

@Controller('storage')
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

  @Get('posts/:postId/files/:fileId')
  async getFile(
    @Param('postId', ParseIntPipe) postId: number,
    @Param('fileId', ParseIntPipe) fileId: number,
    @Res() response: Response,
  ) {
    const file = await this.storageService.getFile(postId, fileId);

    response.setHeader('Content-Type', file.mimeType);
    response.setHeader('Content-Length', file.size.toString());
    response.setHeader('Cache-Control', file.cacheControl);
    response.setHeader('ETag', file.etag);

    file.stream.on('error', (error) => {
      response.destroy(error);
    });

    file.stream.pipe(response);
  }

  @Get('posts/:postId/files/:fileId/editable')
  @UseGuards(JwtAuthGuard)
  async getEditableFile(
    @Param('postId', ParseIntPipe) postId: number,
    @Param('fileId', ParseIntPipe) fileId: number,
    @Req() request: AuthenticatedRequest,
    @Res() response: Response,
  ) {
    const file = await this.storageService.getEditableFile(postId, fileId, {
      username: request.user.username,
      provider: request.user.provider,
      role: request.user.role,
    });

    response.setHeader('Content-Type', file.mimeType);
    response.setHeader('Content-Length', file.size.toString());
    response.setHeader('Cache-Control', file.cacheControl);
    response.setHeader('ETag', file.etag);

    file.stream.on('error', (error) => {
      response.destroy(error);
    });

    file.stream.pipe(response);
  }
}
