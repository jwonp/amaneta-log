import {
  extractFileUrlsFromMarkdown,
  extractPostStorageFileIdsFromMarkdown,
} from './post-markdown.util';

describe('post markdown utils', () => {
  it('extracts markdown image urls without duplicates', () => {
    const markdown = [
      '![cover](/api/storage/1/files/12)',
      '![duplicate](/api/storage/1/files/12)',
      '![external](https://example.com/image.png)',
    ].join('\n');

    expect(extractFileUrlsFromMarkdown(markdown)).toEqual([
      '/api/storage/1/files/12',
      'https://example.com/image.png',
    ]);
  });

  it('extracts only file ids that belong to the current post storage route', () => {
    const markdown = [
      '![used](/api/storage/1/files/12)',
      '![absolute](https://amaneta.dev/api/storage/1/files/33)',
      '![other-post](/api/storage/2/files/99)',
      '<img src="/api/storage/1/files/44" />',
      '![invalid](/api/storage/1/files/not-a-number)',
    ].join('\n');

    expect(extractPostStorageFileIdsFromMarkdown(markdown, 1)).toEqual([
      12, 33,
    ]);
  });
});
