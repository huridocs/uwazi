// eslint-disable-next-line node/no-restricted-import
import { createWriteStream } from 'fs';
// eslint-disable-next-line node/no-restricted-import
import { readFile } from 'fs/promises';

import { TestUtils } from 'api/common.v2/utils/Test';
import { Result } from 'api/core/libs/Result';
import { ShellExecutor } from 'api/core/libs/shell/ShellExecutor';
import { DiskFile } from 'api/files.v2/model/DiskFile';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { createHash } from 'crypto';
import { tmpdir } from 'os';
import path from 'path';
import { pipeline } from 'stream/promises';
import { FileIsNotAPDF, PDFService } from '../PDFService';

const errorShell = TestUtils.mockClass<ShellExecutor>({
  execute: jest.fn().mockImplementation(() => Result.fail(new Error('generic shell error'))),
});

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
    it('should extract text indexed per page, with apended page in every word for elastic search purposes', async () => {
      const testFile = new DiskFile(
        path.join(__dirname, 'testing_files', '12345.test.pdf')
      ).toContent();
      const conversion = (await pdf.extractText(testFile)).getDataOrThrow();

      expect(conversion.pages['1'].includes('Page[[1]] 1[[1]]')).toBeTruthy();
      expect(conversion.pages['2'].includes('Page[[2]] 2[[2]]')).toBeTruthy();
      expect(conversion.pages['3'].includes('Page[[3]] 3[[3]]')).toBeTruthy();

      expect(conversion.totalPages).toBe(11);
      expect(conversion.language).toMatchObject({ key: 'en' });
    });

    describe('when pdf is invalid or malformed', () => {
      it('should throw FileIsNotAPDF error', async () => {
        const invalidFile = new DiskFile(
          path.join(__dirname, 'testing_files', '1invalid.test.pdf')
        ).toContent();
        pdf = new PDFService();

        const result = await pdf.extractText(invalidFile);
        expect(result.getError()).toBeInstanceOf(FileIsNotAPDF);
      });
    });

    describe('when shell throws an error', () => {
      it('should bubble up the error', async () => {
        const invalidFile = new DiskFile(
          path.join(__dirname, 'testing_files', '1invalid.test.pdf')
        ).toContent();
        pdf = new PDFService(errorShell);

        const result = await pdf.extractText(invalidFile);
        expect(
          result.getError()?.message.toLowerCase().includes('generic shell error')
        ).toBeTruthy();
      });
    });
  });

  describe('createThumbnail', () => {
    it('should create thumbnail', async () => {
      const testFile = new DiskFile(
        path.join(__dirname, 'testing_files', '12345.test.pdf')
      ).toContent();
      const thumbnail = (await pdf.createThumbnail(testFile)).getDataOrThrow();
      expect(thumbnail).toBeInstanceOf(DiskFile);

      const thumbnailPath = path.join(tmpdir(), `thumbnail_${Date.now()}_${Math.random()}.jpg`);
      await pipeline(thumbnail.toContent().read(), createWriteStream(thumbnailPath));

      expect(
        await filesAreIdentical(
          path.join(__dirname, 'testing_files/12345.thumb.proof.jpg'),
          thumbnailPath
        )
      ).toBe(true);
    });

    describe('when pdf is invalid or malformed', () => {
      it('should throw FileIsNotAPDF error', async () => {
        const invalidFile = new DiskFile(
          path.join(__dirname, 'testing_files', '1invalid.test.pdf')
        ).toContent();
        pdf = new PDFService();

        const result = await pdf.createThumbnail(invalidFile);
        expect(result.getError()).toBeInstanceOf(FileIsNotAPDF);
      });
    });

    describe('when shell throws an error', () => {
      it('should bubble up the error', async () => {
        const invalidFile = new DiskFile(
          path.join(__dirname, 'testing_files', '1invalid.test.pdf')
        ).toContent();
        pdf = new PDFService(errorShell);

        const result = await pdf.createThumbnail(invalidFile);
        expect(
          result.getError()?.message.toLowerCase().includes('generic shell error')
        ).toBeTruthy();
      });
    });
  });
});
