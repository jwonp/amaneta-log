import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { PostService } from './post.service';
import type {
  GetEditablePostListQuery,
  GetEditablePostListResponse,
  GetEditablePostByIdResponse,
  GetPostByIdResponse,
  GetPostDraftIdResponse,
  SavePostRequset,
  GetPostListQuery,
  GetPostListResponse,
  SavePostResponse,
} from './post.dto.type';
import type { AuthenticatedRequest } from '../auth/auth.type';

@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get()
  async getPosts(
    @Query() query: GetPostListQuery,
  ): Promise<GetPostListResponse> {
    return await this.postService.getPosts(query);
  }

  @Get('editable')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getEditablePosts(
    @Req() request: AuthenticatedRequest,
    @Query() query: GetEditablePostListQuery,
  ): Promise<GetEditablePostListResponse> {
    return await this.postService.getEditablePosts(
      {
        username: request.user.username,
        provider: request.user.provider,
      },
      query,
    );
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
    @Req() request: AuthenticatedRequest,
    @Param('postId') postId: string,
  ): Promise<GetEditablePostByIdResponse> {
    return await this.postService.getEditablePostById(Number(postId), {
      username: request.user.username,
      provider: request.user.provider,
    });
  }

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

  @Patch(':postId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  async savePost(
    @Req() request: AuthenticatedRequest,
    @Param('postId') postId: string,
    @Body() body: SavePostRequset,
  ): Promise<SavePostResponse> {
    return await this.postService.savePost(Number(postId), body, request.user);
  }
}
