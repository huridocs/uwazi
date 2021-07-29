import path from 'path';
import request, { Response as SuperTestResponse } from 'supertest';
import { Application, Request, Response, NextFunction } from 'express';

import { search } from 'api/search';
import { customUploadsPath, fileExists, uploadsPath } from 'api/files/filesystem';
import db from 'api/utils/testing_db';
import { setUpApp } from 'api/utils/testingRoutes';
import connections from 'api/relationships';

import { FileType } from 'shared/types/fileType';
import entities from 'api/entities';
import JSONRequest from 'shared/JSONRequest';
import { UserRole } from 'shared/types/userSchema';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { fixtures, uploadId, uploadId2 } from './fixtures';
import { files } from '../files';
import uploadRoutes from '../routes';

describe('files routes', () => {
  const app: Application = setUpApp(
    uploadRoutes,
    (req: Request, _res: Response, next: NextFunction) => {
      (req as any).user = {
        role: UserRole.COLLABORATOR,
        username: 'User 1',
      };
      next();
    }
  );

  beforeEach(async () => {
    spyOn(search, 'indexEntities').and.returnValue(Promise.resolve());
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => testingEnvironment.tearDown());

  describe('POST/files', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/files')
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({ _id: uploadId.toString(), originalname: 'newName' });
    });

    it('should save file on the body', async () => {
      const [upload] = await files.get({ _id: uploadId.toString() });
      expect(upload).toEqual(
        expect.objectContaining({
          originalname: 'newName',
        })
      );
    });

    it('should reindex all entities that are related to the saved file', async () => {
      expect(search.indexEntities).toHaveBeenCalledWith({ sharedId: 'sharedId1' }, '+fullText');
    });

    describe('when external url file', () => {
      it('should request and store the mimetype', async () => {
        const headers = new Headers();
        headers.set('content-type', 'image/png');

        jest
          .spyOn(JSONRequest, 'head')
          .mockResolvedValue({ json: () => {}, headers, status: 200, cookie: null });

        await request(app)
          .post('/api/files')
          .set('X-Requested-With', 'XMLHttpRequest')
          .send({ url: 'http://awesomecats.org/ahappycat.png', originalname: 'A Happy Cat' });

        const [file]: FileType[] = await files.get({ originalname: 'A Happy Cat' });
        expect(file.mimetype).toBe('image/png');
      });
    });
  });

  describe('GET/files', () => {
    it('should return all uploads based on the filter', async () => {
      const response: SuperTestResponse = await request(app)
        .get('/api/files')
        .set('X-Requested-With', 'XMLHttpRequest')
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
        .set('X-Requested-With', 'XMLHttpRequest')
        .attach('file', path.join(__dirname, 'test.txt'));

      const [file]: FileType[] = await files.get({ originalname: 'test.txt' });

      await request(app)
        .delete('/api/files')
        .set('X-Requested-With', 'XMLHttpRequest')
        .query({ _id: file._id?.toString() });

      expect(await fileExists(customUploadsPath(file.filename || ''))).toBe(false);
    });

    it('should reindex all entities that are related to the files deleted', async () => {
      await request(app)
        .delete('/api/files')
        .set('X-Requested-With', 'XMLHttpRequest')
        .query({ _id: uploadId2.toString() });

      expect(search.indexEntities).toHaveBeenCalledWith(
        { sharedId: { $in: ['sharedId1'] } },
        '+fullText'
      );
    });

    it('should delete all connections related to the file', async () => {
      await request(app)
        .delete('/api/files')
        .set('X-Requested-With', 'XMLHttpRequest')
        .query({ _id: uploadId2.toString() });

      const allConnections = await connections.get();
      expect(allConnections.length).toBe(1);
      expect(allConnections[0]).toEqual(expect.objectContaining({ entity: 'entity3' }));
    });

    it('should validate _id as string', async () => {
      const response: SuperTestResponse = await request(app)
        .delete('/api/files')
        .set('X-Requested-With', 'XMLHttpRequest')
        .query({ _id: { test: 'test' } });

      expect(response.body.errors[0].message).toBe('should be string');
    });

    describe('api/files/tocReviewed', () => {
      it('should set tocGenerated to false on the file', async () => {
        const response: SuperTestResponse = await request(app)
          .post('/api/files/tocReviewed')
          .set('content-language', 'es')
          .set('X-Requested-With', 'XMLHttpRequest')
          .send({ fileId: uploadId.toString() });

        const [file] = await files.get({ _id: uploadId });
        expect(file.generatedToc).toBe(false);
        expect(response.body.entity).toBe('sharedId1');
      });

      it('should set tocGenerated to false on the entity when all associated files are false', async () => {
        await request(app)
          .post('/api/files/tocReviewed')
          .set('X-Requested-With', 'XMLHttpRequest')
          .send({ fileId: uploadId.toString() })
          .expect(200);

        let [entity] = await entities.get({ sharedId: 'sharedId1' });
        expect(entity.generatedToc).toBe(true);

        await request(app)
          .post('/api/files/tocReviewed')
          .set('X-Requested-With', 'XMLHttpRequest')
          .send({ fileId: uploadId2.toString() })
          .expect(200);

        [entity] = await entities.get({ sharedId: 'sharedId1' });
        expect(entity.generatedToc).toBe(false);
      });
    });
  });

  describe('POST/files/attachment', () => {
    it('should save file on the body', async () => {
      const entityId = db.id();
      await request(app)
        .post('/api/files/upload/attachment')
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({
          originalname: 'Dont bring me down - 1979',
          entity: entityId,
        });

      const [attachment] = await files.get({ entity: entityId.toString() });
      expect(attachment).toEqual(
        expect.objectContaining({
          originalname: 'Dont bring me down - 1979',
          type: 'attachment',
        })
      );
    });
  });

  describe('POST/files/upload/document', () => {
    it('should save the attached file', async () => {
      const response = await request(app)
        .post('/api/files/upload/document')
        .set('X-Requested-With', 'XMLHttpRequest')
        .attach('file', path.join(__dirname, 'test.txt'));
      expect(response.status).toBe(200);
      const [file]: FileType[] = await files.get({ originalname: 'test.txt' });
      expect(await fileExists(uploadsPath(file.filename || ''))).toBe(true);
    });
  });
});
