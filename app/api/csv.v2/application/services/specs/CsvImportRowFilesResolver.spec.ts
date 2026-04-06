import { FileContents } from '#api/core/domain/files/FileContents.js';
import { FileStorage } from '#api/core/application/contracts/FileStorage.js';
import { TestUtils } from '#api/common.v2/utils/Test.js';
import { CsvHeaderAnalyzer } from '../CsvHeaderAnalyzer.js';
import { CsvImportRowFilesResolver } from '../CsvImportRowFilesResolver.js';

const createFileContents = (text: string) =>
  new FileContents(async function* fileContentsGenerator() {
    yield new Uint8Array(Buffer.from(text, 'utf8'));
  });

const createFileStorage = (filesByName: Record<string, string>) =>
  TestUtils.mockClass<FileStorage>({
    getFile: jest.fn(({ filename }: { filename: string }) => {
      const content = filesByName[filename];
      if (!content) {
        throw new Error(`Missing file: ${filename}`);
      }
      return createFileContents(content);
    }),
  });

const buildHeaderAnalysis = (params?: {
  defaultLanguage?: string;
  languagesPerHeader?: Record<string, Set<string>>;
}) =>
  ({
    headersWithoutLanguage: [],
    languagesPerHeader: params?.languagesPerHeader || {},
    propertiesByName: {},
    defaultLanguage: params?.defaultLanguage || 'en',
  }) as ReturnType<typeof CsvHeaderAnalyzer.analyze>;

describe('CsvImportRowFilesResolver', () => {
  it('should resolve a single document from file column', async () => {
    const fileStorage = createFileStorage({ 'main.pdf': 'content-main' });

    const resolved = await CsvImportRowFilesResolver.resolve({
      importId: 'import-id',
      rowValues: ['main.pdf'],
      sanitizedHeaders: ['file'],
      headerAnalysis: buildHeaderAnalysis(),
      fileStorage,
    });

    expect(resolved.documents).toHaveLength(1);
    expect(resolved.documents[0].metadata.originalname).toBe('main.pdf');
    expect(resolved.attachments).toHaveLength(0);
  });

  it('should resolve default-language file when file language columns exist', async () => {
    const fileStorage = createFileStorage({
      'default-file.pdf': 'content-default',
      'spanish-file.pdf': 'content-es',
    });

    const resolved = await CsvImportRowFilesResolver.resolve({
      importId: 'import-id',
      rowValues: ['default-file.pdf', 'spanish-file.pdf'],
      sanitizedHeaders: ['file__en', 'file__es'],
      headerAnalysis: buildHeaderAnalysis({
        defaultLanguage: 'en',
        languagesPerHeader: { file: new Set(['en', 'es']) },
      }),
      fileStorage,
    });

    expect(resolved.documents).toHaveLength(1);
    expect(resolved.documents[0].metadata.originalname).toBe('default-file.pdf');
  });

  it('should treat piped file value as a single filename for backward compatibility', async () => {
    const fileStorage = createFileStorage({
      'doc-a.pdf': 'content-a',
      'doc-b.pdf': 'content-b',
    });

    await expect(
      CsvImportRowFilesResolver.resolve({
        importId: 'import-id',
        rowValues: ['doc-a.pdf|doc-b.pdf'],
        sanitizedHeaders: ['file'],
        headerAnalysis: buildHeaderAnalysis(),
        fileStorage,
      })
    ).rejects.toThrow('CSV import missing file "doc-a.pdf|doc-b.pdf" for import import-id');
  });

  it('should resolve multiple documents from files column and combine with file', async () => {
    const fileStorage = createFileStorage({
      'single.pdf': 'single',
      'multi-a.pdf': 'multi-a',
      'multi-b.pdf': 'multi-b',
      'attachment-a.jpg': 'attachment',
    });

    const resolved = await CsvImportRowFilesResolver.resolve({
      importId: 'import-id',
      rowValues: ['single.pdf', 'multi-a.pdf|multi-b.pdf', 'attachment-a.jpg'],
      sanitizedHeaders: ['file', 'files', 'attachments'],
      headerAnalysis: buildHeaderAnalysis(),
      fileStorage,
    });

    expect(resolved.documents.map(file => file.metadata.originalname)).toEqual([
      'single.pdf',
      'multi-a.pdf',
      'multi-b.pdf',
    ]);
    expect(resolved.attachments).toHaveLength(1);
    expect(resolved.attachments[0].metadata.originalname).toBe('attachment-a.jpg');
  });
});
