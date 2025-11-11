import { legacyLogger } from 'api/log';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { createHash } from 'crypto';
import { FileContents } from 'api/files.v2/model/FileContents';
// eslint-disable-next-line node/no-restricted-import
import { createReadStream, createWriteStream } from 'fs';
// eslint-disable-next-line node/no-restricted-import
import { readFile } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';
import { pipeline } from 'stream/promises';
import { PDFService } from '../PDFService';

describe('PDFService', () => {
  let pdf: PDFService;

  async function filesAreIdentical(file1: string, file2: string) {
    const [buf1, buf2] = await Promise.all([readFile(file1), readFile(file2)]);
    const hash1 = createHash('sha256').update(buf1).digest('hex');
    const hash2 = createHash('sha256').update(buf2).digest('hex');
    return hash1 === hash2;
  }

  beforeEach(async () => {
    await testingEnvironment.setTenant();
    pdf = new PDFService();
  });

  describe('extractText', () => {
    it.each([
      {
        case: 'Path',
        testFile: new FileContents(path.join(__dirname, 'testing_files', '12345.test.pdf')),
      },
      {
        case: 'Readable',
        testFile: new FileContents({
          filename: '12345.test.pdf',
          readableCallback: async () =>
            createReadStream(path.join(__dirname, 'testing_files', '12345.test.pdf')),
        }),
      },
    ])(
      'should extract text indexed per page, with apended page in every word for elastic search purposes ($case)',
      async ({ testFile }) => {
        const conversion = (await pdf.extractText(testFile)).getDataOrThrow();

        expect(conversion.pages['1'].includes('Page[[1]] 1[[1]]')).toBeTruthy();
        expect(conversion.pages['2'].includes('Page[[2]] 2[[2]]')).toBeTruthy();
        expect(conversion.pages['3'].includes('Page[[3]] 3[[3]]')).toBeTruthy();

        expect(conversion.totalPages).toBe(11);
        expect(conversion.language).toMatchObject({ key: 'en' });
      }
    );

    it('should throw error with proper error message pdf is invalid or malformed', async () => {
      const invalidFile = new FileContents(
        path.join(__dirname, 'testing_files', '1invalid.test.pdf')
      );
      pdf = new PDFService();

      const result = await pdf.extractText(invalidFile);
      expect(
        result.getError()?.message.toLowerCase().includes('shell command failed')
      ).toBeTruthy();
    });
  });

  describe('createThumbnail', () => {
    it.each([
      {
        case: 'Path',
        testFile: new FileContents(path.join(__dirname, 'testing_files', '12345.test.pdf')),
      },
      {
        case: 'Readable',
        testFile: new FileContents({
          filename: '12345.test.pdf',
          readableCallback: async () =>
            createReadStream(path.join(__dirname, 'testing_files', '12345.test.pdf')),
        }),
      },
    ])('should create thumbnail ($case)', async ({ testFile }) => {
      const thumbnail = (await pdf.createThumbnail(testFile)).getDataOrThrow();
      expect(thumbnail).toBeInstanceOf(FileContents);

      const thumbnailPath = path.join(tmpdir(), `thumbnail_${Date.now()}_${Math.random()}.jpg`);
      await pipeline(
        (await thumbnail.getReadable()).getDataOrThrow(),
        createWriteStream(thumbnailPath)
      );

      expect(
        await filesAreIdentical(
          path.join(__dirname, 'testing_files/12345.thumb.proof.jpg'),
          thumbnailPath
        )
      ).toBe(true);
    });

    it('should return the error when there is one', async () => {
      legacyLogger.error = jest.fn();

      const invalidFile = new FileContents(path.join(__dirname, 'testing_files', 'not_a_pdf.pdf'));

      const result = await pdf.createThumbnail(invalidFile);
      expect(
        result.getError()?.message.toLowerCase().includes('shell command failed')
      ).toBeTruthy();
    });
  });
});
