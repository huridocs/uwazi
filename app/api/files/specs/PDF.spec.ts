import { legacyLogger } from 'api/log';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { PDF } from '../PDF';
import { uploadsPath, deleteFile, fileExistsOnPath } from '../filesystem';

describe('PDF', () => {
  let pdf: PDF;
  const file = {
    filename: '12345.test.pdf',
    originalname: 'originalName.pdf',
    destination: __dirname,
  };
  let thumbnailPath: string;

  const deleteThumbnail = async () => {
    await deleteFile(thumbnailPath);
  };

  beforeEach(async () => {
    await testingEnvironment.setTenant();
    thumbnailPath = uploadsPath('documentId.jpg');
    pdf = new PDF(file);
  });

  describe('convert', () => {
    it('should extract text indexed per page, with apended page in every word for elastic search purposes', async () => {
      const conversion = await pdf.convert();

      const pages = conversion.fullText;
      expect(pages['1'].includes('Page[[1]] 1[[1]]')).toBeTruthy();
      expect(pages['2'].includes('Page[[2]] 2[[2]]')).toBeTruthy();
      expect(pages['3'].includes('Page[[3]] 3[[3]]')).toBeTruthy();
    });

    it('should return the conversion object', async () => {
      const conversion = await pdf.convert();

      expect(conversion).toEqual(
        expect.objectContaining({
          totalPages: 11,
          toc: [],
          language: 'eng',
          filename: '12345.test.pdf',
          originalname: 'originalName.pdf',
          destination: __dirname,
        })
      );
    });

    it('should throw error with proper error message pdf is invalid or malformed', async () => {
      const invalidFile = {
        filename: '1invalid.test.pdf',
        originalname: 'originalName.pdf',
        destination: __dirname,
      };
      pdf = new PDF(invalidFile);

      try {
        await pdf.convert();
        fail('should throw error');
      } catch (e) {
        expect(e.message.toLowerCase().includes('may not be a pdf')).toBeTruthy();
      }
    });
  });

  describe('createThumbnail', () => {
    beforeEach(async () => {
      await deleteThumbnail();
    });

    it('should create thumbnail', async () => {
      await pdf.createThumbnail('documentId');

      expect(await fileExistsOnPath(thumbnailPath)).toBe(true);
    });

    it('should return the error when there is one', async () => {
      legacyLogger.error = jest.fn();
      pdf = new PDF({ filename: '/missingpath/pdf.pdf' });

      const thumbnailResponse = await pdf.createThumbnail('documentId');

      expect(thumbnailResponse instanceof Error).toBe(true);
      expect(await fileExistsOnPath(thumbnailPath)).toBe(false);
    });
  });
});
