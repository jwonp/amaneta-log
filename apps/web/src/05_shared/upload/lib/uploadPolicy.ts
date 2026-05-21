import { HttpStatus } from "@/src/05_shared/api/common/model/api.const"

export const CONTENT_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const

export const THUMBNAIL_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const

export const CONTENT_MAX_BYTES = 10 * 1024 * 1024
export const THUMBNAIL_MAX_BYTES = 5 * 1024 * 1024
export const MAX_MULTIPART_BODY_BYTES = CONTENT_MAX_BYTES + 256 * 1024

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] as const
const GIF87A_SIGNATURE = [0x47, 0x49, 0x46, 0x38, 0x37, 0x61] as const
const GIF89A_SIGNATURE = [0x47, 0x49, 0x46, 0x38, 0x39, 0x61] as const
const WEBP_RIFF_SIGNATURE = [0x52, 0x49, 0x46, 0x46] as const
const WEBP_WEBP_SIGNATURE = [0x57, 0x45, 0x42, 0x50] as const

type UploadValidationError = {
  status: number
  body: {
    message: string
  }
}

const startsWithSignature = (bytes: Uint8Array, signature: readonly number[]) => {
  if (bytes.length < signature.length) {
    return false
  }

  return signature.every((value, index) => bytes[index] === value)
}

export const detectImageMimeType = (bytes: Uint8Array) => {
  if (startsWithSignature(bytes, [0xff, 0xd8, 0xff])) {
    return "image/jpeg"
  }

  if (startsWithSignature(bytes, PNG_SIGNATURE)) {
    return "image/png"
  }

  if (
    startsWithSignature(bytes, GIF87A_SIGNATURE) ||
    startsWithSignature(bytes, GIF89A_SIGNATURE)
  ) {
    return "image/gif"
  }

  if (
    startsWithSignature(bytes, WEBP_RIFF_SIGNATURE) &&
    bytes.length >= 12 &&
    startsWithSignature(bytes.slice(8, 12), WEBP_WEBP_SIGNATURE)
  ) {
    return "image/webp"
  }

  return null
}

export const getUploadPolicy = (usage: string) => {
  return usage === "THUMBNAIL"
    ? {
        allowedMimeTypes: [...THUMBNAIL_ALLOWED_MIME_TYPES],
        maxBytes: THUMBNAIL_MAX_BYTES,
      }
    : {
        allowedMimeTypes: [...CONTENT_ALLOWED_MIME_TYPES],
        maxBytes: CONTENT_MAX_BYTES,
      }
}

export const parseContentLengthHeader = (value: string | null) => {
  if (!value) {
    return null
  }

  const parsed = Number.parseInt(value, 10)

  if (!Number.isFinite(parsed) || parsed < 0) {
    return null
  }

  return parsed
}

export const validateUploadContentLength = (
  contentLength: number | null
): UploadValidationError | null => {
  if (contentLength != null && contentLength > MAX_MULTIPART_BODY_BYTES) {
    return {
      status: HttpStatus.PAYLOAD_TOO_LARGE,
      body: {
        message: "request body exceeds upload limit",
      },
    }
  }

  return null
}

export const validateUpload = async (file: File, usage: string) => {
  const { allowedMimeTypes, maxBytes } = getUploadPolicy(usage)

  if (!allowedMimeTypes.includes(file.type as (typeof allowedMimeTypes)[number])) {
    return {
      status: HttpStatus.UNSUPPORTED_MEDIA_TYPE,
      body: {
        message: "unsupported file type",
      },
    }
  }

  if (file.size > maxBytes) {
    return {
      status: HttpStatus.PAYLOAD_TOO_LARGE,
      body: {
        message: "file size exceeds upload limit",
      },
    }
  }

  const detectedMimeType = detectImageMimeType(new Uint8Array(await file.arrayBuffer()))

  if (!detectedMimeType || detectedMimeType !== file.type) {
    return {
      status: HttpStatus.UNSUPPORTED_MEDIA_TYPE,
      body: {
        message: "file content does not match declared mime type",
      },
    }
  }

  return null
}
