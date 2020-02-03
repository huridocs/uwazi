/** @format */

import path from 'path';
import fs from 'fs';
import request, { Response as SuperTestResponse } from 'supertest';
import { Application, Request, Response, NextFunction } from 'express';

import db from 'api/utils/testing_db';
import errorLog from 'api/log/errorLog';
import { uploadsPath } from 'api/utils/files';

import fixtures from './fixtures.js';
import uploads from '../uploads';

import uploadRoutes from '../routes';
import paths from '../../config/paths';
import { setUpApp, socketEmit, iosocket } from './helpers';

jest.mock(
  '../../auth/authMiddleware.js',
  () => () => (_req: Request, _res: Response, next: NextFunction) => {
    next();
  }
);

describe('upload routes', () => {
  const app: Application = setUpApp(uploadRoutes);

  beforeEach(async () => {
    paths.uploadedDocuments = `${__dirname}/uploads/`;
    spyOn(Date, 'now').and.returnValue(1000);
    spyOn(errorLog, 'error'); //just to avoid annoying console output
    await db.clearAllAndLoad(fixtures);
  });

  afterAll(async () => db.disconnect());

  const uploadDocument = (filepath: string): Promise<SuperTestResponse> =>
    socketEmit('documentProcessed', () =>
      request(app)
        .post('/api/upload/document')
        .field('entity', 'sharedId1')
        .attach('file', path.join(__dirname, filepath))
    );

  describe('POST/upload/document', () => {
    it('should upload the file', async () => {
      await uploadDocument('uploads/f2082bf51b6ef839690485d7153e847a.pdf');

      const [upload] = await uploads.get({ entity: 'sharedId1' }, '+fullText');
      expect(fs.readFileSync(uploadsPath(upload.filename || ''))).toBeDefined();
    });

    it('should process the document after upload', async () => {
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

      const [upload] = await uploads.get({ entity: 'sharedId1' }, '+fullText');

      expect(upload).toEqual(
        expect.objectContaining({
          entity: 'sharedId1',
          processed: true,
          fullText: { 1: 'Test[[1]] file[[1]]\n\n' },
          totalPages: 1,
          language: 'other',
          filename: expect.stringMatching(/.*\.pdf/),
          originalname: 'f2082bf51b6ef839690485d7153e847a.pdf',
          creationDate: 1000,
        })
      );
    });

    it('should generate a thumbnail for the document', async () => {
      await uploadDocument('uploads/f2082bf51b6ef839690485d7153e847a.pdf');

      const [upload] = await uploads.get({ entity: 'sharedId1' }, '+fullText');
      const thumbnailName = `${upload._id}.jpg`;

      expect(fs.readFileSync(uploadsPath(thumbnailName))).toBeDefined();
    });

    describe('Language detection', () => {
      it('should detect English documents and store the result', async () => {
        await uploadDocument('uploads/eng.pdf');

        const [upload] = await uploads.get({ entity: 'sharedId1' });
        expect(upload.language).toBe('eng');
      });

      it('should detect Spanish documents and store the result', async () => {
        await uploadDocument('uploads/spn.pdf');

        const [upload] = await uploads.get({ entity: 'sharedId1' });
        expect(upload.language).toBe('spa');
      });
    });

    describe('when conversion fails', () => {
      it('should set document processed to false and emit a socket conversionFailed event with the id of the document', async () => {
        await socketEmit('conversionFailed', () =>
          request(app)
            .post('/api/upload/document')
            .field('entity', 'sharedId1')
            .attach('file', path.join(__dirname, 'uploads/invalid_document.txt'))
        );

        const [upload] = await uploads.get({ entity: 'sharedId1' }, '+fullText');
        expect(upload.processed).toBe(false);
      });
    });
  });
});
