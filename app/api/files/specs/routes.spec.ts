import path from 'path';
import request, { Response as SuperTestResponse } from 'supertest';
import { Application, Request, Response, NextFunction } from 'express';

import { search } from 'api/search';
import { customUploadsPath, fileExists, uploadsPath } from 'api/files/filesystem';
import db from 'api/utils/testing_db';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { setUpApp } from 'api/utils/testingRoutes';
import connections from 'api/relationships';

import { FileType } from 'shared/types/fileType';
import entities from 'api/entities';
import * as ocrRecords from 'api/services/ocr/ocrRecords';
import { Suggestions } from 'api/suggestions/suggestions';
import {
  fixtures,
  uploadId,
  uploadId2,
  restrictedUploadId,
  restrictedUploadId2,
  adminUser,
  writerUser,
} from './fixtures';
import { files } from '../files';
import uploadRoutes from '../routes';
import { FileUpdatedEvent } from '../events/FileUpdatedEvent';
import { applicationEventsBus } from 'api/eventsbus';

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
    spyOn(search, 'indexEntities').and.returnValue(Promise.resolve());
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

    it(`should emit a ${FileUpdatedEvent.name} an existing file as been saved`, async () => {
      const emitySpy = jest.spyOn(applicationEventsBus, 'emit');

      const original = await db.mongodb?.collection('files').findOne({ _id: uploadId });

      await request(app)
        .post('/api/files')
        .send({
          ...original,
          extractedMetadata: [
            {
              name: 'propertyName',
              selection: {
                text: 'something',
                selectionRectangles: [{ top: 0, left: 0, width: 0, height: 0, page: '1' }],
              },
            },
          ],
        });

      const after = await db.mongodb?.collection('files').findOne({ _id: uploadId });
      expect(emitySpy).toHaveBeenCalled();
      expect(emitySpy.mock.calls[0][0]).toBeInstanceOf(FileUpdatedEvent);
      expect(emitySpy.mock.calls[0][0].getData()).toEqual({ before: original, after });
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
        .query({ type: 'custom' })
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
        .query({ type: 'custom' })
        .expect(200);

      expect(response.body.map((file: FileType) => file.originalname)).toEqual([
        'upload1',
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
        .query({ _id: uploadId.toString(), type: 'custom' })
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

      expect(await fileExists(customUploadsPath(file.filename || ''))).toBe(false);
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

    it('should delete related ix suggestions', async () => {
      await request(app).delete('/api/files').query({ _id: uploadId.toString() });
      expect(
        await db.mongodb?.collection('ixsuggestions').find({ fileId: restrictedUploadId }).toArray()
      ).toHaveLength(2);
      expect(
        await db.mongodb?.collection('ixsuggestions').find({ fileId: uploadId }).toArray()
      ).toHaveLength(0);
    });

    it('should validate _id as string', async () => {
      const response: SuperTestResponse = await request(app)
        .delete('/api/files')
        .query({ _id: { test: 'test' } });

      expect(response.body.errors[0].message).toBe('should be string');
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
        .send({
          originalname: 'Dont bring me down - 1979',
          entity: entityId,
        })
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
      const response = await request(app)
        .post('/api/files/upload/document')
        .attach('file', path.join(__dirname, 'test.txt'));
      expect(response.status).toBe(200);
      const [file]: FileType[] = await files.get({ originalname: 'test.txt' });
      expect(await fileExists(uploadsPath(file.filename || ''))).toBe(true);
    });
  });
});
