import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { PostService } from './post.service';
import type {
  GetEditablePostByIdResponse,
  GetPostByIdResponse,
  GetPostDraftIdResponse,
  SavePostRequset,
} from './post.dto.type';
import type { AuthenticatedRequest } from '../auth/auth.type';

@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post('draft')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getPostDraftId(
    @Req() request: AuthenticatedRequest,
  ): Promise<GetPostDraftIdResponse> {
    return await this.postService.getPostDraftId({
      username: request.user.username,
      provider: request.user.provider,
    });
  }

  @Get(':postId')
  async getPostById(
    @Param('postId') postId: string,
  ): Promise<GetPostByIdResponse> {
    return await this.postService.getPostById(Number(postId));
  }

  @Get(':postId/edit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getEditablePostById(
    @Param('postId') postId: string,
  ): Promise<GetEditablePostByIdResponse> {
    return await this.postService.getEditablePostById(Number(postId));
  }

  @Patch(':postId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async savePost(
    @Param('postId') postId: string,
    @Body() body: SavePostRequset,
  ) {
    return this.postService.savePost(Number(postId), body);
  }
}
