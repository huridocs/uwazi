import {
  convertToPDFService,
  MimeTypeNotSupportedForConversion,
} from 'api/services/convertToPDF/convertToPdfService';
import { testingEnvironment } from 'api/utils/testingEnvironment';
// eslint-disable-next-line node/no-restricted-import
import { writeFile } from 'fs/promises';
import { files } from '../files';
import { attachmentsPath, setupTestUploadedPaths } from '../filesystem';
import { processDocument } from '../processDocument';

describe('processDocument', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp({});
    await setupTestUploadedPaths();
    await writeFile(attachmentsPath('test.docx'), 'data');
  });

  afterAll(async () => testingEnvironment.tearDown());

  describe('process non pdf document', () => {
    it('should go through the normal pdf flow (when feature is not active)', async () => {
      await expect(
        processDocument('entity_shared_id', {
          destination: `${__dirname}/uploads/test.docx`,
          mimetype: 'application/msword',
        })
      ).rejects.toMatchObject({ message: expect.stringContaining('pdftotext') });
    });

    it('should save the document as an attachment (when feature is active)', async () => {
      jest.spyOn(convertToPDFService, 'upload').mockResolvedValue();
      await testingEnvironment.setUp({
        settings: [
          {
            languages: [{ key: 'en', label: 'English' }],
            features: { convertToPdf: { active: true, url: 'http://serviceurl.uwazi.io' } },
          },
        ],
      });

      const file = await processDocument('entity_shared_id', {
        filename: 'test.docx',
        mimetype: 'application/msword',
      });

      const [dbFile] = await files.get({ entity: 'entity_shared_id' });
      expect(dbFile.type).toBe('attachment');
      expect(dbFile._id).toEqual(file._id);
      expect(convertToPDFService.upload).toHaveBeenCalledWith(
        expect.objectContaining(file),
        'http://serviceurl.uwazi.io'
      );
    });

    it('should remove the file when convertToPdfService.upload returns error', async () => {
      jest
        .spyOn(convertToPDFService, 'upload')
        .mockRejectedValue(new MimeTypeNotSupportedForConversion('jpg: mymetype not allowed'));

      await testingEnvironment.setUp({
        settings: [
          {
            languages: [{ label: 'English', key: 'en' }],
            features: { convertToPdf: { active: true, url: '' } },
          },
        ],
      });

      await processDocument('entity_shared_id', {
        filename: 'test.docx',
        mimetype: 'image/jpeg',
      });

      const [file] = await files.get({ entity: 'entity_shared_id' });
      expect(file).toBeUndefined();
    });
  });
});
