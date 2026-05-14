import {
  extractFileUrlsFromMarkdown,
  extractPostStorageStoredNamesFromMarkdown,
} from './post-markdown.util';

describe('post markdown utils', () => {
  it('extracts markdown image and html media urls without duplicates', () => {
    const markdown = [
      '![image](http://localhost:9000/amaneta-log/posts/1/content/a.png)',
      '![duplicate](http://localhost:9000/amaneta-log/posts/1/content/a.png)',
      '<img src="/storages/posts/1/files/2" />',
      '<video src="https://cdn.example.com/video.mp4"></video>',
    ].join('\n');

    expect(extractFileUrlsFromMarkdown(markdown)).toEqual([
      'http://localhost:9000/amaneta-log/posts/1/content/a.png',
      '/storages/posts/1/files/2',
      'https://cdn.example.com/video.mp4',
    ]);
  });

  it('extracts only stored names that belong to the current post storage path', () => {
    const markdown = [
      '![used](http://localhost:9000/amaneta-log/posts/1/content/a.png)',
      '<img src="http://localhost:9000/amaneta-log/posts/1/content/b%20file.png" />',
      '![other-post](http://localhost:9000/amaneta-log/posts/2/content/c.png)',
      '![external](https://example.com/posts/1/content/d.png)',
    ].join('\n');

    expect(
      extractPostStorageStoredNamesFromMarkdown(markdown, 1, 'amaneta-log'),
    ).toEqual(['a.png', 'b file.png']);
  });
});
