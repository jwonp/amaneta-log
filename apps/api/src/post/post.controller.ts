import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
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
  GetTagListResponse,
  SavePostRequset,
  GetPostListQuery,
  GetPostListResponse,
  SavePostResponse,
} from './post.dto.type';
import type { AuthenticatedRequest } from '../auth/auth.type';
import {
  ParseGetEditablePostListQueryPipe,
  ParseGetPostListQueryPipe,
  ParseSavePostRequestPipe,
} from './post.validation';

@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get()
  async getPosts(
    @Query(new ParseGetPostListQueryPipe()) query: GetPostListQuery,
  ): Promise<GetPostListResponse> {
    return await this.postService.getPosts(query);
  }

  @Get('editable')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getEditablePosts(
    @Req() request: AuthenticatedRequest,
    @Query(new ParseGetEditablePostListQueryPipe())
    query: GetEditablePostListQuery,
  ): Promise<GetEditablePostListResponse> {
    return await this.postService.getEditablePosts(
      {
        username: request.user.username,
        provider: request.user.provider,
      },
      query,
    );
  }

  @Get('tags')
  async getTags(): Promise<GetTagListResponse> {
    return await this.postService.getTags();
  }

  @Get(':postId')
  async getPostById(
    @Param('postId', ParseIntPipe) postId: number,
  ): Promise<GetPostByIdResponse> {
    return await this.postService.getPostById(postId);
  }

  @Get(':postId/edit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getEditablePostById(
    @Req() request: AuthenticatedRequest,
    @Param('postId', ParseIntPipe) postId: number,
  ): Promise<GetEditablePostByIdResponse> {
    return await this.postService.getEditablePostById(postId, {
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
    @Param('postId', ParseIntPipe) postId: number,
    @Body(new ParseSavePostRequestPipe()) body: SavePostRequset,
  ): Promise<SavePostResponse> {
    return await this.postService.savePost(postId, body, request.user);
  }
}
