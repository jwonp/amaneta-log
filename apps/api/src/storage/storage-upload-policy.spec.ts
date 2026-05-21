import {
  assertUploadConstraints,
  detectImageMimeType,
} from './storage-upload-policy';

describe('storage upload policy', () => {
  it('detects known image signatures', () => {
    expect(
      detectImageMimeType(
        Uint8Array.from([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x43]),
      ),
    ).toBe('image/jpeg');
  });

  it('rejects mismatched mime type and magic bytes', () => {
    expect(() =>
      assertUploadConstraints({
        usage: 'CONTENT',
        mimeType: 'image/png',
        size: 6,
        buffer: Buffer.from([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x43]),
      }),
    ).toThrow('file content does not match declared mime type');
  });
});
