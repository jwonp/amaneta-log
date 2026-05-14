const MARKDOWN_IMAGE_REGEX = /!\[[^\]]*]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
const HTML_MEDIA_SRC_REGEX = /<(?:img|video)[^>]+src=["']([^"']+)["']/g;

export const extractFileUrlsFromMarkdown = (markdown: string): string[] => {
  const urls = new Set<string>();

  for (const match of markdown.matchAll(MARKDOWN_IMAGE_REGEX)) {
    if (match[1]) {
      urls.add(match[1]);
    }
  }

  for (const match of markdown.matchAll(HTML_MEDIA_SRC_REGEX)) {
    if (match[1]) {
      urls.add(match[1]);
    }
  }

  return Array.from(urls);
};

export const extractPostStorageStoredNamesFromMarkdown = (
  markdown: string,
  postId: number,
  bucket?: string,
): string[] => {
  const storedNames = new Set<string>();
  const postPathPattern = bucket
    ? `/${bucket}/posts/${postId}/`
    : `/posts/${postId}/`;

  for (const url of extractFileUrlsFromMarkdown(markdown)) {
    const storedName = extractStoredNameFromPostStorageUrl(
      url,
      postPathPattern,
      Boolean(bucket),
    );

    if (storedName) {
      storedNames.add(storedName);
    }
  }

  return Array.from(storedNames);
};

const extractStoredNameFromPostStorageUrl = (
  url: string,
  postPathPattern: string,
  shouldRequireAbsoluteUrl: boolean,
) => {
  try {
    const parsedUrl = new URL(url);
    return extractStoredNameFromPath(parsedUrl.pathname, postPathPattern);
  } catch {
    if (shouldRequireAbsoluteUrl) {
      return null;
    }

    return extractStoredNameFromPath(url, postPathPattern);
  }
};

const extractStoredNameFromPath = (path: string, postPathPattern: string) => {
  const postPathStart = path.indexOf(postPathPattern);

  if (postPathStart === -1) {
    return null;
  }

  const pathAfterPostId = path.slice(postPathStart + postPathPattern.length);
  const segments = pathAfterPostId.split('/').filter(Boolean);

  if (segments.length < 2) {
    return null;
  }

  const storedName = segments[1];

  if (!storedName) {
    return null;
  }

  return decodeURIComponent(storedName);
};
