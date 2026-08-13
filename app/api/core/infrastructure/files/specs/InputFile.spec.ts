import { Readable } from 'stream';
// eslint-disable-next-line node/no-restricted-import
import { unlink } from 'fs/promises';
import { InputFile } from '../InputFile.js';

describe('InputFile.fromStream', () => {
  const createdFiles: string[] = [];

  afterEach(async () => {
    await Promise.all(
      createdFiles.splice(0).map(async file => unlink(file).catch(() => undefined))
    );
  });

  const fromStream = async (params: {
    originalname: string;
    mimetype?: string;
    type?: 'document' | 'attachment';
  }) => {
    const inputFile = await InputFile.fromStream({
      stream: Readable.from(['file-bytes']),
      ...params,
    });
    createdFiles.push(inputFile.filepath);
    return inputFile;
  };

  it('should resolve mimetype from the original filename, including PDFs', async () => {
    const inputFile = await fromStream({ originalname: 'report.pdf', type: 'document' });

    expect(inputFile.metadata.mimetype).toBe('application/pdf');
  });

  it('should fall back to application/octet-stream when the extension is unknown', async () => {
    const inputFile = await fromStream({ originalname: 'file.unknownext' });

    expect(inputFile.metadata.mimetype).toBe('application/octet-stream');
  });

  it('should keep an explicit mimetype when provided', async () => {
    const inputFile = await fromStream({
      originalname: 'report.pdf',
      mimetype: 'image/png',
    });

    expect(inputFile.metadata.mimetype).toBe('image/png');
  });
});
