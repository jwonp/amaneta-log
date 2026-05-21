import {
  Post,
  PostStatus,
  StorageFile,
  User,
} from '@/generated/prisma/client.cjs';

export enum SavePostMode {
  AUTO = 'AUTO',
  DRAFT = 'DRAFT',
  PUBLISH = 'PUBLISH',
}

export interface GetPostDraftIdResponse {
  id: number;
  status: PostStatus;
}

export interface GetPostByIdResponse {
  post: Omit<Post, 'status' | 'publishedAt' | 'isPublic' | 'authorId'> & {
    thumbnail?: string;
  };
  author: Pick<User, 'username' | 'profileImage'>;
  files: Pick<StorageFile, 'id' | 'kind' | 'storedName' | 'mimeType'>[];
}

export interface GetEditablePostByIdResponse {
  post: Post;
  files: StorageFile[];
}

export type EditablePostListVisibility = 'all' | 'public' | 'draft';

export interface GetEditablePostListQuery {
  limit?: number;
  cursor?: string;
  query?: string;
  visibility?: EditablePostListVisibility;
  tag?: string;
}

export interface GetPostListQuery {
  limit?: number;
  cursor?: string;
  query?: string;
  tag?: string;
}

export interface EditablePostListItemDto {
  id: number;
  isPublic: boolean;
  tags: string[];
  title: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  author: string;
  thumbnailFileId: number | null;
}

export type PostListItemDto = Omit<EditablePostListItemDto, 'isPublic'>;

export interface GetEditablePostListResponse {
  items: EditablePostListItemDto[];
  pageInfo: {
    nextCursor: string | null;
    hasNextPage: boolean;
  };
  appliedFilters: {
    query: string | null;
    visibility: EditablePostListVisibility;
    tag: string | null;
    limit: number;
  };
}
export interface GetPostListResponse {
  items: PostListItemDto[];
  pageInfo: {
    nextCursor: string | null;
    hasNextPage: boolean;
  };
  appliedFilters: {
    query: string | null;
    tag: string | null;
    limit: number;
  };
}

export interface SavePostRequset {
  title: string;
  description?: string | null;
  markdown: string;
  tags: string[];
  isPublic: boolean;
  saveMode: SavePostMode;
  thumbnailId?: number | null;
}

export interface SavePostResponse {
  id: number;
  status: PostStatus;
  isPublic: boolean;
  updatedAt: string;
  publishedAt: string | null;
}
