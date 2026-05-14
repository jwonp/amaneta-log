import {
  StorageFileKind,
  StorageFileStatus,
  StorageFileUsage,
} from '@/generated/prisma/client.cjs';
import type { JwtUserPayload } from '../auth/auth.type';

export type UploadedMemoryFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

export type UploadPostFileParams = {
  postId: number;
  usage: StorageFileUsage;
  file: UploadedMemoryFile;
  user: JwtUserPayload;
};

export type UploadPostFileResponse = {
  id: number;
  postId: number;
  usage: StorageFileUsage;
  kind: StorageFileKind;
  status: StorageFileStatus;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  publicUrl: string;
};
