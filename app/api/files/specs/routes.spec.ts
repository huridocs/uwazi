import path from 'path';
import request, { Response as SuperTestResponse } from 'supertest';
import { Application, Request, Response, NextFunction } from 'express';

import { search } from 'api/search';
import db from 'api/utils/testing_db';
import { setUpApp } from 'api/utils/testingRoutes';
import connections from 'api/relationships';

import { FileType } from 'shared/types/fileType';
import entities from 'api/entities';
import * as ocrRecords from 'api/services/ocr/ocrRecords';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { errorLog } from 'api/log';
import { storage } from '../storage';
import {
  fixtures,
  uploadId,
  uploadId2,
  restrictedUploadId2,
  adminUser,
  writerUser,
} from './fixtures';
import { files } from '../files';
import uploadRoutes from '../routes';

describe('files routes', () => {
  const collabUser = fixtures.users!.find(u => u.username === 'collab');
  let requestMockedUser = collabUser;

  const app: Application = setUpApp(
    uploadRoutes,
    (req: Request, _res: Response, next: NextFunction) => {
      (req as any).user = (() => requestMockedUser)();
      next();
    }
  );

  beforeEach(async () => {
    spyOn(search, 'indexEntities').and.callFake(async () => Promise.resolve());
    await testingEnvironment.setUp(fixtures);
    requestMockedUser = collabUser;
    testingEnvironment.setPermissions(collabUser);
  });

  afterAll(async () => testingEnvironment.tearDown());

  describe('POST/files', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/files')
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
      it('should guess the mimetype', async () => {
        await request(app)
          .post('/api/files')
          .send({ url: 'https://awesomecats.org/ahappycat.png', originalname: 'A Happy Cat' });

        const [file]: FileType[] = await files.get({ originalname: 'A Happy Cat' });
        expect(file.mimetype).toBe('image/png');
      });

      it('should return a validation error for a no secured url', async () => {
        const rest = await request(app)
          .post('/api/files')
          .send({ url: 'http://awesomecats.org/ahappycat.png', originalname: 'A Happy Cat' });

        expect(rest.status).toBe(400);
      });
    });
  });

  describe('GET/files', () => {
    it('should return entity related files only if the user has permission for the entity', async () => {
      testingEnvironment.setPermissions(writerUser);
      const response: SuperTestResponse = await request(app)
        .get('/api/files')
        .query({ type: 'document' })
        .expect(200);

      expect(response.body.map((file: FileType) => file.originalname)).toEqual([
        'restrictedUpload',
        'restrictedUpload2',
        'upload2',
      ]);
    });

    it('should return all uploads for an admin', async () => {
      testingEnvironment.setPermissions(adminUser);
      const response: SuperTestResponse = await request(app)
        .get('/api/files')
        .query({ type: 'document' })
        .expect(200);

      expect(response.body.map((file: FileType) => file.originalname)).toEqual([
        'upload1',
        'fileNotInDisk',
        'restrictedUpload',
        'restrictedUpload2',
        'upload2',
      ]);
    });

    it('should only allow properly typed id and type parameters in the query', async () => {
      testingEnvironment.setPermissions(adminUser);

      await request(app).get('/api/files').query({ $where: '1===1' }).expect(400);

      await request(app)
        .get('/api/files')
        .query({ type: { $exists: 1 } })
        .expect(400);

      const response: SuperTestResponse = await request(app)
        .get('/api/files')
        .query({ _id: uploadId.toString(), type: 'document' })
        .expect(200);

      expect(response.body.map((file: FileType) => file.originalname)).toEqual(['upload1']);
    });
  });

  describe('DELETE/api/files', () => {
    beforeEach(() => {
      testingEnvironment.setPermissions(adminUser);
    });

    it('should not allow any extra parameters aside from a properly typed id', async () => {
      await request(app)
        .delete('/api/files')
        .query({ _id: 'someid', __property__: 'should_not_be_here' })
        .expect(400);

      await request(app)
        .delete('/api/files')
        .query({ _id: { $eq: 1234 } })
        .expect(400);
    });

    it('should delete upload and return the response', async () => {
      await request(app)
        .post('/api/files/upload/custom')
        .attach('file', path.join(__dirname, 'test.txt'));

      const [file]: FileType[] = await files.get({ originalname: 'test.txt' });

      await request(app).delete('/api/files').query({ _id: file._id?.toString() });

      expect(await storage.fileExists(file.filename!, 'custom')).toBe(false);
    });

    it('should allow deletion if and only if user has permission for the entity', async () => {
      testingEnvironment.setPermissions(collabUser);
      await request(app)
        .delete('/api/files')
        .query({ _id: restrictedUploadId2.toString() })
        .expect(404);

      testingEnvironment.setPermissions(writerUser);
      await request(app)
        .delete('/api/files')
        .query({ _id: restrictedUploadId2.toString() })
        .expect(200);
    });

    it('should reindex all entities that are related to the files deleted', async () => {
      await request(app).delete('/api/files').query({ _id: uploadId2.toString() }).expect(200);

      expect(search.indexEntities).toHaveBeenCalledWith(
        { sharedId: { $in: ['sharedId1'] } },
        '+fullText'
      );
    });

    it('should delete all connections related to the file', async () => {
      await request(app).delete('/api/files').query({ _id: uploadId2.toString() });

      const allConnections = await connections.get();
      expect(allConnections.length).toBe(2);
      expect(allConnections[0]).toEqual(expect.objectContaining({ entity: 'entity3' }));
      expect(allConnections[1]).toEqual(expect.objectContaining({ entity: 'sharedId1' }));
    });

    it('should cleanup the ocr records related to the file', async () => {
      const ocrCleanupSpy = jest.spyOn(ocrRecords, 'cleanupRecordsOfFiles');
      await request(app).delete('/api/files').query({ _id: uploadId2.toString() });
      expect(ocrCleanupSpy).toHaveBeenCalledWith([uploadId2]);
    });

    it('should validate _id as string', async () => {
      const response: SuperTestResponse = await request(app)
        .delete('/api/files')
        .query({ _id: { test: 'test' } });

      expect(response.body.errors[0].message).toBe('must be string');
    });

    describe('api/files/tocReviewed', () => {
      beforeEach(() => {
        // WARNING!!! this sets an editor user in the permissions context.
        // It's inconsistent with the request logged-in user!!
        // This is here to avoid changing the test implementation without research.
        // Fix the inconsistency and remove this.
        testingEnvironment.setPermissions();
      });

      it('should set tocGenerated to false on the file', async () => {
        const response: SuperTestResponse = await request(app)
          .post('/api/files/tocReviewed')
          .set('content-language', 'es')
          .send({ fileId: uploadId.toString() });

        const [file] = await files.get({ _id: uploadId });
        expect(file.generatedToc).toBe(false);
        expect(response.body.entity).toBe('sharedId1');
      });

      it('should set tocGenerated to false on the entity when all associated files are false', async () => {
        await request(app)
          .post('/api/files/tocReviewed')
          .send({ fileId: uploadId.toString() })
          .expect(200);

        let [entity] = await entities.get({ sharedId: 'sharedId1' });
        expect(entity.generatedToc).toBe(true);

        await request(app)
          .post('/api/files/tocReviewed')
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
        .field('entity', entityId.toString())
        .attach('file', Buffer.from('attachment content'), 'Dont bring me down - 1979')
        .expect(200);

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
      spyOn(errorLog, 'debug');
      const response = await request(app)
        .post('/api/files/upload/document')
        .attach('file', path.join(__dirname, 'test.txt'));
      expect(response.status).toBe(200);
      const [file]: FileType[] = await files.get({ originalname: 'test.txt' });

      expect(await storage.fileExists(file.filename!, 'document')).toBe(true);
      expect(errorLog.debug).toHaveBeenCalledWith(expect.stringContaining('Deprecation'));
    });
  });

  describe('POST/files/upload/*', () => {
    describe.each(['document', 'attachment'] as FileType['type'][])('when file is a %s', type => {
      it.each(['Hello, World.pdf', 'Aló mundo.pdf', 'Привет, мир.pdf', '헬로월드.pdf'])(
        'should accept the filename %s in a field',
        async filename => {
          const response = await request(app)
            .post(`/api/files/upload/${type}`)
            .field('originalname', filename)
            .attach('file', path.join(__dirname, filename));
          expect(response.status).toBe(200);
          const [file]: FileType[] = await files.get({ originalname: filename, type });
          expect(file).not.toBe(undefined);
        }
      );
    });
  });
});
