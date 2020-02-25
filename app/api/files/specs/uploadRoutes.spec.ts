import path from 'path';
import fs from 'fs';
import request, { Response as SuperTestResponse } from 'supertest';
import { Application, Request, Response, NextFunction } from 'express';

import { search } from 'api/search';
import db from 'api/utils/testing_db';
import errorLog from 'api/log/errorLog';
import { uploadsPath, customUploadsPath, setupTestUploadedPaths } from 'api/files/filesystem';
import { setUpApp, socketEmit, iosocket } from 'api/utils/testingRoutes';
import { FileType } from 'shared/types/fileType';

import { fixtures } from './fixtures';
import { files } from '../files';
import uploadRoutes from '../routes';

jest.mock(
  '../../auth/authMiddleware.js',
  () => () => (_req: Request, _res: Response, next: NextFunction) => {
    next();
  }
);

describe('upload routes', () => {
  const app: Application = setUpApp(uploadRoutes);

  beforeEach(async () => {
    setupTestUploadedPaths();
    spyOn(search, 'indexEntities').and.returnValue(Promise.resolve());
    spyOn(Date, 'now').and.returnValue(1000);
    spyOn(errorLog, 'error'); //just to avoid annoying console output
    await db.clearAllAndLoad(fixtures);
  });

  afterAll(async () => db.disconnect());

  const uploadDocument = async (filepath: string): Promise<SuperTestResponse> =>
    socketEmit('documentProcessed', async () =>
      request(app)
        .post('/api/files/upload/document')
        .field('entity', 'sharedId1')
        .attach('file', path.join(__dirname, filepath))
    );

  describe('POST/files/upload/documents', () => {
    it('should upload the file', async () => {
      await uploadDocument('uploads/f2082bf51b6ef839690485d7153e847a.pdf');

      const [upload] = await files.get({ entity: 'sharedId1' }, '+fullText');
      expect(fs.readFileSync(uploadsPath(upload.filename || ''))).toBeDefined();
    });

    it('should process and reindex the document after upload', async () => {
      const res: SuperTestResponse = await uploadDocument(
        'uploads/f2082bf51b6ef839690485d7153e847a.pdf'
      );

      expect(res.body).toEqual(
        expect.objectContaining({
          originalname: 'f2082bf51b6ef839690485d7153e847a.pdf',
        })
      );

      expect(iosocket.emit).toHaveBeenCalledWith('conversionStart', 'sharedId1');
      expect(iosocket.emit).toHaveBeenCalledWith('documentProcessed', 'sharedId1');

      const [upload] = await files.get({ entity: 'sharedId1' }, '+fullText');

      expect(upload).toEqual(
        expect.objectContaining({
          entity: 'sharedId1',
          type: 'document',
          processed: true,
          fullText: { 1: 'Test[[1]] file[[1]]\n\n' },
          totalPages: 1,
          language: 'other',
          filename: expect.stringMatching(/.*\.pdf/),
          originalname: 'f2082bf51b6ef839690485d7153e847a.pdf',
          creationDate: 1000,
        })
      );

      expect(search.indexEntities).toHaveBeenCalledWith({ sharedId: 'sharedId1' }, '+fullText');
    });

    it('should generate a thumbnail for the document', async () => {
      await uploadDocument('uploads/f2082bf51b6ef839690485d7153e847a.pdf');

      const [{ filename = '', language }] = await files.get({
        entity: 'sharedId1',
        type: 'thumbnail',
      });

      expect(language).toBe('other');
      expect(fs.readFileSync(uploadsPath(filename))).toBeDefined();
    });

    describe('Language detection', () => {
      it('should detect English documents and store the result', async () => {
        await uploadDocument('uploads/eng.pdf');

        const [upload] = await files.get({ entity: 'sharedId1' });
        expect(upload.language).toBe('eng');
      });

      it('should detect Spanish documents and store the result', async () => {
        await uploadDocument('uploads/spn.pdf');

        const [upload] = await files.get({ entity: 'sharedId1' });
        expect(upload.language).toBe('spa');
      });
    });

    describe('when conversion fails', () => {
      it('should set document processed to false and emit a socket conversionFailed event with the id of the document', async () => {
        await socketEmit('conversionFailed', async () =>
          request(app)
            .post('/api/files/upload/document')
            .field('entity', 'sharedId1')
            .attach('file', path.join(__dirname, 'uploads/invalid_document.txt'))
        );

        const [upload] = await files.get({ entity: 'sharedId1' }, '+fullText');
        expect(upload.processed).toBe(false);
      });
    });
  });

  describe('POST/files/upload/custom', () => {
    it('should save the upload and return it', async () => {
      const response: SuperTestResponse = await request(app)
        .post('/api/files/upload/custom')
        .attach('file', path.join(__dirname, 'test.txt'));

      expect(response.body).toEqual(
        expect.objectContaining({
          type: 'custom',
          filename: expect.stringMatching(/.*\.txt/),
          mimetype: 'text/plain',
          originalname: 'test.txt',
          size: 5,
        })
      );
    });

    it('should save the file on customUploads path', async () => {
      await request(app)
        .post('/api/files/upload/custom')
        .attach('file', path.join(__dirname, 'test.txt'));

      const [file]: FileType[] = await files.get({ originalname: 'test.txt' });

      expect(fs.readFileSync(customUploadsPath(file.filename || ''))).toBeDefined();
    });
  });
});
