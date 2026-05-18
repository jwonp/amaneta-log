const MARKDOWN_IMAGE_REGEX = /!\[[^\]]*]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
const EDITOR_STORAGE_PATH_REGEX = /^\/api\/storage\/(\d+)\/files\/(\d+)$/;

export const extractFileUrlsFromMarkdown = (markdown: string): string[] => {
  const urls = new Set<string>();

  for (const match of markdown.matchAll(MARKDOWN_IMAGE_REGEX)) {
    if (match[1]) {
      urls.add(match[1]);
    }
  }

  return Array.from(urls);
};

export const extractPostStorageFileIdsFromMarkdown = (
  markdown: string,
  postId: number,
): number[] => {
  const fileIds = new Set<number>();

  for (const url of extractFileUrlsFromMarkdown(markdown)) {
    const fileReference = extractPostStorageFileReference(url);

    if (!fileReference || fileReference.postId !== postId) {
      continue;
    }

    fileIds.add(fileReference.fileId);
  }

  return Array.from(fileIds);
};

const extractPostStorageFileReference = (url: string) => {
  try {
    const parsedUrl = new URL(url, 'http://localhost');

    return extractPostStorageFileReferenceFromPath(parsedUrl.pathname);
  } catch {
    return null;
  }
};

const extractPostStorageFileReferenceFromPath = (path: string) => {
  const matchedPath = path.match(EDITOR_STORAGE_PATH_REGEX);

  if (!matchedPath) {
    return null;
  }

  const postId = Number.parseInt(matchedPath[1] ?? '', 10);
  const fileId = Number.parseInt(matchedPath[2] ?? '', 10);

  if (!Number.isFinite(postId) || !Number.isFinite(fileId)) {
    return null;
  }

  return {
    postId,
    fileId,
  };
};
