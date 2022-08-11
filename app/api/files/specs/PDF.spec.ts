import { testingEnvironment } from 'api/utils/testingEnvironment';
import { errorLog } from 'api/log';
import { PDF } from '../PDF';
import { uploadsPath, deleteFile, fileExistsOnPath } from '../filesystem';

describe('PDF', () => {
  let pdf: PDF;
  const file = {
    filename: '12345.test.pdf',
    originalname: 'originalName.pdf',
    destination: __dirname,
  };
  let thumbnailName: string;

  const deleteThumbnail = async () => {
    await deleteFile(uploadsPath(thumbnailName));
  };

  beforeEach(async () => {
    await testingEnvironment.setTenant();
    thumbnailName = uploadsPath('documentId.jpg');
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
      expect(await fileExistsOnPath(thumbnailName)).toBe(true);
    });

    it('should correctly log errors, but continue with the flow', async () => {
      spyOn(errorLog, 'error');
      pdf = new PDF({
        filename: '/missingpath/pdf.pdf',
      });
      const thumbnailResponse = await pdf.createThumbnail('documentId');
      expect(thumbnailResponse instanceof Error).toBe(true);
      expect(errorLog.error).toHaveBeenCalledWith(
        'Thumbnail creation error for: /missingpath/pdf.pdf'
      );
    });
  });
});
