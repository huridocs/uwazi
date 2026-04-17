import testingDB from '#api/utils/testing_db.js';
import {
  convertToPDFService,
  MimeTypeNotSupportedForConversion,
} from '#api/services/convertToPDF/convertToPdfService.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
// eslint-disable-next-line node/no-restricted-import
import { writeFile } from 'fs/promises';
import entitiesModel from '#api/entities/entitiesModel.js';
import { files, UpdateFileError } from '../files.js';
import { attachmentsPath, setupTestUploadedPaths } from '../filesystem.js';
import { processDocument, convertPDF } from '../processDocument.js';
import { PDF } from '../PDF.js';

const f = getFixturesFactory();

describe('processDocument', () => {
  beforeEach(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
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

  it('should not persist file or thumbnail if there is an UpdateFileError', async () => {
    const _id = testingDB.id();
    const promise = processDocument('any_entity_shared_id', {
      _id,
      filename: 'any_file_name',
      originalname: 'any_original_name',
    });

    await expect(promise).rejects.toEqual(new UpdateFileError());
    const [file] = await files.get({ _id });
    const [thumbnail] = await files.get({ entity: _id, type: 'thumbnail' });

    expect(file).toBeUndefined();
    expect(thumbnail).toBeUndefined();
  });

  describe('convertPDF - entity preview', () => {
    const sharedId = 'previewEntity';

    beforeEach(async () => {
      await testingEnvironment.setUp({
        settings: [
          {
            languages: [
              { default: true, key: 'en', label: 'English' },
              { key: 'es', label: 'Spanish' },
            ],
          },
        ],
        templates: [f.template('t1')],
        entities: [
          f.entity(sharedId, 't1', {}, { language: 'en' }),
          f.entity(sharedId, 't1', {}, { language: 'es' }),
        ],
      });
      await setupTestUploadedPaths();
    });

    it('should set preview on all entity language rows after thumbnail creation', async () => {
      const thumbnailFilename = 'preview-thumb.jpg';

      jest.spyOn(PDF.prototype, 'convert').mockResolvedValue({
        language: 'eng', // ISO639-3 for English
        fullText: {},
        totalPages: 1,
        generatedToc: false,
      } as any);

      jest.spyOn(PDF.prototype, 'createThumbnail').mockResolvedValue({
        filename: thumbnailFilename,
        size: 1024,
      } as any);

      const upload = await files.save({
        entity: sharedId,
        type: 'document',
        status: 'processing',
        filename: 'doc.pdf',
        originalname: 'doc.pdf',
        mimetype: 'application/pdf',
      });

      await new Promise<void>((resolve, reject) => {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        convertPDF(
          upload as any,
          sharedId,
          { filename: 'doc.pdf', destination: attachmentsPath('doc.pdf') },
          false,
          () => resolve(),
          e => reject(e)
        );
      });

      const entityRows = await entitiesModel.get({ sharedId });
      const en = entityRows.find(e => e.language === 'en');
      const es = entityRows.find(e => e.language === 'es');

      expect(en?.preview).toBe(thumbnailFilename);
      expect(es?.preview).toBe(thumbnailFilename);
    });
  });
});
