import path from 'path';
import request, { Response as SuperTestResponse } from 'supertest';
import { Application, Request, Response, NextFunction } from 'express';

import { search } from 'api/search';
import { fileExists } from 'api/csv/specs/helpers';
import { setupTestUploadedPaths, customUploadsPath } from 'api/files/filesystem';
import db from 'api/utils/testing_db';
import { setUpApp } from 'api/utils/testingRoutes';
import connections from 'api/relationships';

import { FileType } from 'shared/types/fileType';
import { fixtures, uploadId } from './fixtures';
import { files } from '../files';
import uploadRoutes from '../routes';

jest.mock(
  '../../auth/authMiddleware.js',
  () => () => (_req: Request, _res: Response, next: NextFunction) => {
    next();
  }
);

describe('files routes', () => {
  const app: Application = setUpApp(uploadRoutes);

  beforeEach(async () => {
    spyOn(search, 'indexEntities').and.returnValue(Promise.resolve());
    setupTestUploadedPaths();
    await db.clearAllAndLoad(fixtures);
  });
  afterAll(async () => db.disconnect());

  describe('POST/files', () => {
    it('should save file on the body', async () => {
      await request(app)
        .post('/api/files')
        .send({ _id: uploadId.toString(), originalname: 'newName' });

      const [upload] = await files.get({ _id: uploadId.toString() });

      expect(upload).toEqual(
        expect.objectContaining({
          originalname: 'newName',
        })
      );
    });
  });

  describe('GET/files', () => {
    it('should return all uploads based on the filter', async () => {
      const response: SuperTestResponse = await request(app)
        .get('/api/files')
        .query({ type: 'custom' });

      expect(response.body.map((file: FileType) => file.originalname)).toEqual([
        'upload1',
        'upload2',
      ]);
    });
  });

  describe('DELETE/api/files', () => {
    it('should delete upload and return the response', async () => {
      await request(app)
        .post('/api/files/upload/custom')
        .attach('file', path.join(__dirname, 'test.txt'));

      const [file]: FileType[] = await files.get({ originalname: 'test.txt' });

      await request(app)
        .delete('/api/files')
        .query({ _id: file._id?.toString() });

      expect(await fileExists(customUploadsPath(file.filename || ''))).toBe(false);
    });

    it('should reindex all entities that are related to the files deleted', async () => {
      await request(app)
        .delete('/api/files')
        .query({ _id: uploadId.toString() });

      expect(search.indexEntities).toHaveBeenCalledWith(
        { sharedId: { $in: ['entity'] } },
        '+fullText'
      );
    });

    it('should delete all connections related to the file', async () => {
      await request(app)
        .delete('/api/files')
        .query({ _id: uploadId.toString() });

      const allConnections = await connections.get();
      expect(allConnections.length).toBe(1);
      expect(allConnections[0]).toEqual(expect.objectContaining({ entity: 'entity3' }));
    });

    it('should validate _id as string', async () => {
      const response: SuperTestResponse = await request(app)
        .delete('/api/files')
        .query({ _id: { test: 'test' } });

      expect(response.body.errors[0].message).toBe('should be string');
    });
  });
});
