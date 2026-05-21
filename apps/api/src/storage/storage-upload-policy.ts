import {
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import type { StorageFileUsage } from '../../generated/prisma/client.cjs';

export const CONTENT_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;
export const THUMBNAIL_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;
export const ALL_ALLOWED_MIME_TYPES = Array.from(
  new Set([...CONTENT_ALLOWED_MIME_TYPES, ...THUMBNAIL_ALLOWED_MIME_TYPES]),
);
export const CONTENT_MAX_BYTES = 10 * 1024 * 1024;
export const THUMBNAIL_MAX_BYTES = 5 * 1024 * 1024;
export const MAX_UPLOAD_BYTES = CONTENT_MAX_BYTES;

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] as const;
const GIF87A_SIGNATURE = [0x47, 0x49, 0x46, 0x38, 0x37, 0x61] as const;
const GIF89A_SIGNATURE = [0x47, 0x49, 0x46, 0x38, 0x39, 0x61] as const;
const WEBP_RIFF_SIGNATURE = [0x52, 0x49, 0x46, 0x46] as const;
const WEBP_WEBP_SIGNATURE = [0x57, 0x45, 0x42, 0x50] as const;

const startsWithSignature = (
  bytes: Uint8Array,
  signature: readonly number[],
) => {
  if (bytes.length < signature.length) {
    return false;
  }

  return signature.every((value, index) => bytes[index] === value);
};

export const detectImageMimeType = (bytes: Uint8Array) => {
  if (startsWithSignature(bytes, [0xff, 0xd8, 0xff])) {
    return 'image/jpeg';
  }

  if (startsWithSignature(bytes, PNG_SIGNATURE)) {
    return 'image/png';
  }

  if (
    startsWithSignature(bytes, GIF87A_SIGNATURE) ||
    startsWithSignature(bytes, GIF89A_SIGNATURE)
  ) {
    return 'image/gif';
  }

  if (
    startsWithSignature(bytes, WEBP_RIFF_SIGNATURE) &&
    bytes.length >= 12 &&
    startsWithSignature(bytes.slice(8, 12), WEBP_WEBP_SIGNATURE)
  ) {
    return 'image/webp';
  }

  return null;
};

export const getUploadPolicy = (usage: StorageFileUsage) => {
  return usage === 'THUMBNAIL'
    ? {
        allowedMimeTypes: [...THUMBNAIL_ALLOWED_MIME_TYPES],
        maxBytes: THUMBNAIL_MAX_BYTES,
      }
    : {
        allowedMimeTypes: [...CONTENT_ALLOWED_MIME_TYPES],
        maxBytes: CONTENT_MAX_BYTES,
      };
};

export const assertUploadConstraints = (params: {
  usage: StorageFileUsage;
  mimeType: string;
  size: number;
  buffer: Buffer;
}) => {
  const { allowedMimeTypes, maxBytes } = getUploadPolicy(params.usage);

  if (!allowedMimeTypes.includes(params.mimeType as (typeof allowedMimeTypes)[number])) {
    throw new UnsupportedMediaTypeException('unsupported file type');
  }

  if (params.size > maxBytes) {
    throw new PayloadTooLargeException('file size exceeds upload limit');
  }

  const detectedMimeType = detectImageMimeType(params.buffer);

  if (!detectedMimeType || detectedMimeType !== params.mimeType) {
    throw new UnsupportedMediaTypeException(
      'file content does not match declared mime type',
    );
  }
};
