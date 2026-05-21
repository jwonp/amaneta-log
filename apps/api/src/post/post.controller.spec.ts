import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { Server } from 'node:http';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { PostController } from './post.controller';
import { PostService } from './post.service';

describe('PostController validation', () => {
  let app: INestApplication;
  let httpServer: Server;
  const postService = {
    getPosts: jest.fn(),
    getEditablePosts: jest.fn(),
    getPostById: jest.fn(),
    getEditablePostById: jest.fn(),
    getPostDraftId: jest.fn(),
    savePost: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [PostController],
      providers: [
        {
          provide: PostService,
          useValue: postService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
    httpServer = app.getHttpServer() as Server;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('returns 400 for an invalid postId route param', async () => {
    await request(httpServer).get('/posts/not-a-number').expect(400);

    expect(postService.getPostById).not.toHaveBeenCalled();
  });

  it('returns 400 for an invalid save payload', async () => {
    await request(httpServer)
      .patch('/posts/1')
      .send({
        title: 'title',
        description: 'desc',
        markdown: 'body',
        tags: ['tag'],
        isPublic: 'true',
        saveMode: 'AUTO',
        thumbnailId: null,
      })
      .expect(400);

    expect(postService.savePost).not.toHaveBeenCalled();
  });

  it('returns 400 for an invalid post list query', async () => {
    await request(httpServer).get('/posts?limit=0').expect(400);

    expect(postService.getPosts).not.toHaveBeenCalled();
  });

  it('returns 400 for an invalid editable list visibility', async () => {
    await request(httpServer)
      .get('/posts/editable?visibility=hidden')
      .expect(400);

    expect(postService.getEditablePosts).not.toHaveBeenCalled();
  });

  it('returns 400 for an oversized post title', async () => {
    await request(httpServer)
      .patch('/posts/1')
      .send({
        title: 'a'.repeat(121),
        description: 'desc',
        markdown: 'body',
        tags: ['tag'],
        isPublic: true,
        saveMode: 'AUTO',
        thumbnailId: null,
      })
      .expect(400);

    expect(postService.savePost).not.toHaveBeenCalled();
  });

  it('returns 400 when too many tags are provided', async () => {
    await request(httpServer)
      .patch('/posts/1')
      .send({
        title: 'title',
        description: 'desc',
        markdown: 'body',
        tags: Array.from({ length: 11 }, (_, index) => `tag-${index}`),
        isPublic: true,
        saveMode: 'AUTO',
        thumbnailId: null,
      })
      .expect(400);

    expect(postService.savePost).not.toHaveBeenCalled();
  });
});
