import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  Res,
  UnsupportedMediaTypeException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from './storage.service';
import type { UploadedMemoryFile } from './storage.type';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequest, JwtUserPayload } from '../auth/auth.type';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  ALL_ALLOWED_MIME_TYPES,
  assertUploadConstraints,
  MAX_UPLOAD_BYTES,
} from './storage-upload-policy';

type UploadPostFileBody = {
  usage?: 'CONTENT' | 'THUMBNAIL';
};

const uploadInterceptorOptions = {
  limits: {
    fileSize: MAX_UPLOAD_BYTES,
    files: 1,
  },
  fileFilter: (
    _request: Request,
    file: { mimetype: string },
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (
      !ALL_ALLOWED_MIME_TYPES.includes(
        file.mimetype as (typeof ALL_ALLOWED_MIME_TYPES)[number],
      )
    ) {
      callback(new UnsupportedMediaTypeException('unsupported file type'), false);
      return;
    }

    callback(null, true);
  },
};

@Controller('storage')
export class StorageController {
  constructor(
    private readonly storageService: StorageService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  @Post('posts/:postId/files')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', uploadInterceptorOptions))
  async uploadPostFile(
    @Param('postId', ParseIntPipe) postId: number,
    @Body() body: UploadPostFileBody,
    @UploadedFile() file: UploadedMemoryFile,
    @Req() request: AuthenticatedRequest,
  ) {
    if (!file) {
      throw new BadRequestException('file is required');
    }

    assertUploadConstraints({
      usage: body.usage ?? 'CONTENT',
      mimeType: file.mimetype,
      size: file.size,
      buffer: file.buffer,
    });

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
    @Req() request: Request,
    @Res() response: Response,
  ) {
    const file = await this.storageService.getFile(
      postId,
      fileId,
      await this.getOptionalUserFromRequest(request),
    );

    response.setHeader('Content-Type', file.mimeType);
    response.setHeader('Content-Length', file.size.toString());
    response.setHeader('Cache-Control', file.cacheControl);
    response.setHeader('ETag', file.etag);
    response.setHeader('X-Content-Type-Options', 'nosniff');

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
    const file = await this.storageService.getFile(postId, fileId, {
      username: request.user.username,
      provider: request.user.provider,
      role: request.user.role,
    });

    response.setHeader('Content-Type', file.mimeType);
    response.setHeader('Content-Length', file.size.toString());
    response.setHeader('Cache-Control', file.cacheControl);
    response.setHeader('ETag', file.etag);
    response.setHeader('X-Content-Type-Options', 'nosniff');

    file.stream.on('error', (error) => {
      response.destroy(error);
    });

    file.stream.pipe(response);
  }

  private async getOptionalUserFromRequest(
    request: Request,
  ): Promise<JwtUserPayload | null> {
    const authorization = request.headers.authorization;

    if (!authorization) {
      return null;
    }

    const [scheme, token] = authorization.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new BadRequestException('invalid authorization header');
    }

    try {
      return await this.jwtService.verifyAsync<JwtUserPayload>(token, {
        secret: this.configService.getOrThrow('JWT_ACCESS_SECRET'),
      });
    } catch {
      return null;
    }
  }
}
