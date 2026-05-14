import {
  Post,
  PostStatus,
  StorageFile,
  User,
} from '@/generated/prisma/client.cjs';

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

export interface SavePostRequset {
  title: string;
  description?: string | null;
  markdown: string;
  tags: string[];
  isPublic: boolean;
  thumbnailId?: number | null;
}
