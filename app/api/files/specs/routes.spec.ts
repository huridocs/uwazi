/* eslint-disable max-statements */
import type { Application, NextFunction, Request, Response } from 'express';
import path from 'path';
import request, { Response as SuperTestResponse } from 'supertest';

import { applicationEventsBus } from '#api/core/libs/eventsbus/index.js';
import { spyOnEmit, toEmitEvent, toEmitEventWith } from '#api/core/libs/eventsbus/eventTesting.js';
import entities from '#api/entities/index.js';
import { editorUser } from '#api/entities/specs/entitySavingManagerFixtures.js';
import connections from '#api/relationships/index.js';
import { search } from '#api/search/index.js';
import * as ocrRecords from '#api/services/ocr/ocrRecords.js';
import { registerEventListeners as registerOcrListeners } from '#api/services/ocr/eventListeners.js';
import { appContext } from '#api/utils/AppContext.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { setUpApp } from '#api/utils/testingRoutes.js';
import db from '#api/utils/testing_db.js';
import { FileType } from '#shared/types/fileType.js';
import { UserSchema } from '#shared/types/userType.js';
import { FileCreatedEvent } from '../events/FileCreatedEvent.js';
import { FileUpdatedEvent } from '../events/FileUpdatedEvent.js';
import { FilesDeletedEvent } from '../events/FilesDeletedEvent.js';
import { files } from '../files.js';
import jsRoutes from '../jsRoutes.js';
import uploadRoutes from '../routes.js';
import { storage } from '../storage.js';
import {
  adminUser,
  allowedPublicTemplate,
  collabUser,
  customFileId,
  downloadFixtures,
  externalUrlFileId,
  fixtures,
  readOnlyUploadId,
  restrictedUploadId2,
  uploadId,
  uploadId2,
  writerUser,
} from './fixtures.js';

expect.extend({ toEmitEvent, toEmitEventWith });

registerOcrListeners(applicationEventsBus);

describe('files routes', () => {
  let requestMockedUser: UserSchema = collabUser;

  const app: Application = setUpApp(
    uploadRoutes,
    (req: Request, _res: Response, next: NextFunction) => {
      (req as any).user = (() => requestMockedUser)();
      next();
    }
  );

  const mockCurrentUser = (user: UserSchema) => {
    requestMockedUser = user;
    testingEnvironment.setPermissions(user);
  };

  beforeEach(async () => {
    // jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    jest.spyOn(search, 'indexEntities').mockImplementation(async () => Promise.resolve());
    await testingEnvironment.setUp(fixtures);
    mockCurrentUser(collabUser);
  });

  afterAll(async () => testingEnvironment.tearDown());

  describe('POST/files', () => {
    describe('editor user', () => {
      it('should not have permissions to post files that are of type custom', async () => {
        mockCurrentUser(editorUser);
        const response = await request(app).post('/api/files').send({
          _id: uploadId.toString(),
          originalname: 'custom_file',
          type: 'custom',
        });

        expect(response.status).toBe(404);
      });
    });

    describe('collaborator user', () => {
      it('should allow modification if and only if user has write permission for the entity', async () => {
        mockCurrentUser(collabUser);
        let response = await request(app).post('/api/files').send({
          _id: restrictedUploadId2.toString(),
          originalname: 'changed',
        });

        expect(response.status).toBe(404);

        mockCurrentUser(writerUser);
        response = await request(app).post('/api/files').send({
          _id: restrictedUploadId2.toString(),
          originalname: 'changed2',
        });

        expect(response.status).toBe(200);

        response = await request(app).post('/api/files').send({
          _id: readOnlyUploadId.toString(),
          originalname: 'changed read only',
        });

        expect(response.status).toBe(404);
      });

      it('should not have permissions to post files that are of type custom', async () => {
        mockCurrentUser(collabUser);
        await request(app)
          .post('/api/files')
          .send({
            _id: uploadId.toString(),
            originalname: 'custom_file',
            type: 'custom',
          })
          .expect(404);
      });
    });

    describe('Basic save', () => {
      beforeEach(async () => {
        mockCurrentUser(adminUser);
        await request(app)
          .post('/api/files')
          .send({
            _id: uploadId.toString(),
            originalname: 'newName',
            entity: 'sharedId1',
          })
          .expect(200);
      });

      it('should save file on the body', async () => {
        const uploads = await files.get({ _id: uploadId.toString() });
        expect(uploads[0]).toEqual(
          expect.objectContaining({
            originalname: 'newName',
          })
        );
      });

      it('should reindex all entities that are related to the saved file', async () => {
        expect(search.indexEntities).toHaveBeenCalledWith(
          {
            sharedId: { $in: ['sharedId1'] },
          },
          '+fullText'
        );
      });

      it(`should emit a ${FileUpdatedEvent.name} an existing file as been saved`, async () => {
        const emitSpy = spyOnEmit();

        const [original] = await files.get({ _id: uploadId });

        await request(app)
          .post('/api/files')
          .send({
            ...original,
            propertySelections: [
              {
                name: 'propertyName',
                selection: {
                  text: 'something',
                  selectionRectangles: [
                    {
                      top: 0,
                      left: 0,
                      width: 0,
                      height: 0,
                      page: '1',
                    },
                  ],
                },
              },
            ],
          });

        const [after] = await files.get({ _id: uploadId });
        emitSpy.expectToEmitEventWith(FileUpdatedEvent, {
          before: original,
          after,
        });
        emitSpy.restore();
      });

      it(`should emit a ${FileCreatedEvent.name} if a new file has been saved`, async () => {
        const fileInfo = {
          url: 'https://example.com/doc.pdf',
          entity: 'sharedId1',
          originalname: 'doc.pdf',
          type: 'attachment',
        };
        const caller = async () => request(app).post('/api/files').send(fileInfo).expect(200);
        await expect(caller).toEmitEventWith(FileCreatedEvent, {
          newFile: expect.objectContaining({
            url: 'https://example.com/doc.pdf',
            entity: 'sharedId1',
            originalname: 'doc.pdf',
            type: 'attachment',
            _id: expect.anything(),
          }),
        });
        await expect(caller).not.toEmitEvent(FileUpdatedEvent);
      });

      describe('when external url file', () => {
        it('should guess the mimetype', async () => {
          await request(app).post('/api/files').send({
            url: 'https://awesomecats.org/ahappycat.png',
            originalname: 'A Happy Cat',
            type: 'attachment',
            entity: 'sharedId1',
          });

          const [file]: FileType[] = await files.get({
            originalname: 'A Happy Cat',
          });
          expect(file.mimetype).toBe('image/png');
        });

        it('should return a validation error for a no secured url', async () => {
          const rest = await request(app).post('/api/files').send({
            url: 'http://awesomecats.org/ahappycat.png',
            originalname: 'A Happy Cat',
          });

          expect(rest.status).toBe(400);
        });
      });
    });
  });

  describe('GET/files', () => {
    it('should return entity related files only if the collaborator user has permission for the entity', async () => {
      mockCurrentUser(writerUser);
      const response: SuperTestResponse = await request(app)
        .get('/api/files')
        .query({ type: 'document' })
        .expect(200);

      expect(response.body.map((file: FileType) => file.originalname)).toEqual([
        '테스트 한글chinese-file',
        'publicEntityFile',
        'fileNotInDisk',
        'restrictedUpload',
        'restrictedUpload2',
        'readOnlyUpload',
        'upload2',
      ]);
    });

    it.each([adminUser, editorUser])('should return all uploads for an ($role)', async user => {
      mockCurrentUser(user);
      const response: SuperTestResponse = await request(app)
        .get('/api/files')
        .query({ type: 'document' })
        .expect(200);

      expect(response.body.map((file: FileType) => file.originalname)).toEqual([
        '테스트 한글chinese-file',
        'publicEntityFile',
        'fileNotInDisk',
        'restrictedUpload',
        'restrictedUpload2',
        'readOnlyUpload',
        'upload2',
      ]);
    });

    it('should only allow properly typed id and type parameters in the query', async () => {
      mockCurrentUser(adminUser);

      expect(await request(app).get('/api/files').query({ $where: '1===1' })).toHaveStatus(400);

      expect(
        await request(app)
          .get('/api/files')
          .query({ type: { $exists: 1 } })
      ).toHaveStatus(400);

      const response: SuperTestResponse = await request(app)
        .get('/api/files')
        .query({ _id: uploadId.toString(), type: 'document' });

      expect(response).toHaveStatus(200);
      expect(response.body.map((file: FileType) => file.filename)).toEqual([
        'english_testing_file.pdf',
      ]);
    });
  });

  describe('DELETE /api/files', () => {
    beforeEach(async () => {
      await testingEnvironment.setUp(fixtures);
      mockCurrentUser(adminUser);
    });

    it('should properly delete files that are external urls', async () => {
      const response = await request(app)
        .delete('/api/files')
        .query({ _id: externalUrlFileId.toString() });

      expect(response).toHaveStatus(200);

      const [file] = await files.get({ _id: externalUrlFileId.toString() });
      expect(file).toBeUndefined();
    });

    it('should return an array with the deleted file in the response', async () => {
      const [fileBeforeDelete] = await files.get({ _id: uploadId2.toString() });

      const response = await request(app).delete('/api/files').query({ _id: uploadId2.toString() });

      expect(response).toHaveStatus(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({
        _id: uploadId2.toString(),
        originalname: fileBeforeDelete.originalname,
        entity: fileBeforeDelete.entity,
      });
    });

    it('should delete upload and return the response', async () => {
      await request(app)
        .post('/api/files/upload/document')
        .field('entity', 'sharedId1')
        .attach('file', path.join(__dirname, 'test.txt'));

      const [file]: FileType[] = await files.get({ originalname: 'test.txt' });

      await request(app).delete('/api/files').query({
        _id: file._id?.toString(),
      });

      expect(await storage.fileExists(file.filename!, 'document')).toBe(false);
    });

    it('should allow deletion if and only if user has permission for the entity', async () => {
      mockCurrentUser(collabUser);
      let response = await request(app)
        .delete('/api/files')
        .query({ _id: restrictedUploadId2.toString() });

      expect(response).toHaveStatus(404);

      mockCurrentUser(writerUser);
      response = await request(app)
        .delete('/api/files')
        .query({ _id: restrictedUploadId2.toString() });

      expect(response).toHaveStatus(200);
    });

    it('should allow deletion of custom files only if the user is an admin', async () => {
      mockCurrentUser(editorUser);
      let response = await request(app)
        .delete('/api/files')
        .query({ _id: customFileId.toString() });
      expect(response.status).toBe(404);

      mockCurrentUser(collabUser);
      response = await request(app).delete('/api/files').query({
        _id: customFileId.toString(),
      });
      expect(response.status).toBe(404);

      mockCurrentUser(adminUser);
      response = await request(app).delete('/api/files').query({
        _id: downloadFixtures.customPDF._id.toString(),
      });
      expect(response.status).toBe(200);
    });

    it('should reindex all entities that are related to the files deleted', async () => {
      // @ts-ignore
      search.indexEntities.mockReset();
      const response = await request(app).delete('/api/files').query({
        _id: uploadId2.toString(),
      });

      expect(response).toHaveStatus(200);

      expect(search.indexEntities).toHaveBeenCalledWith(
        { sharedId: { $in: ['sharedId1'] } },
        '+fullText'
      );
    });

    it('should delete all connections related to the file', async () => {
      await request(app).delete('/api/files').query({
        _id: uploadId2.toString(),
      });

      const allConnections = await connections.get();
      expect(allConnections.length).toBe(2);
      expect(allConnections[0]).toEqual(expect.objectContaining({ entity: 'entity3' }));
      expect(allConnections[1]).toEqual(expect.objectContaining({ entity: 'sharedId1' }));
    });

    it('should cleanup the ocr records related to the file', async () => {
      const ocrCleanupSpy = jest.spyOn(ocrRecords, 'cleanupRecordsOfFiles');
      await request(app).delete('/api/files').query({
        _id: uploadId2.toString(),
      });
      expect(ocrCleanupSpy).toHaveBeenCalledWith([uploadId2]);
    });

    describe('events', () => {
      it(`should emit a ${FilesDeletedEvent.name} when a file is deleted`, async () => {
        const emitSpy = spyOnEmit();

        const file = await db.mongodb?.collection('files').findOne({
          _id: uploadId2,
        });
        const response = await request(app).delete('/api/files').query({
          _id: uploadId2.toString(),
        });
        expect(response).toHaveStatus(200);

        emitSpy.expectToEmitEventWith(FilesDeletedEvent, { files: [file!] });
        emitSpy.restore();
      });
    });

    it('should validate _id as string', async () => {
      const response: SuperTestResponse = await request(app)
        .delete('/api/files')
        .query({ _id: { test: 'test' } });

      expect(response.status).toBe(422);
      expect(response.body.error).toContain('Expected string, received object');
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

  describe('api/public', () => {
    it('should run as a transaction', async () => {
      const jsRoutesApp: Application = setUpApp(
        jsRoutes,
        (req: Request, _res: Response, next: NextFunction) => {
          (req as any).user = (() => requestMockedUser)();
          next();
        }
      );
      jest.restoreAllMocks();
      jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
      jest.spyOn(entities, 'getUnrestrictedWithDocuments').mockImplementationOnce(() => {
        throw new Error('error at the end of the saveEntity');
      });
      await request(jsRoutesApp)
        .post('/api/public')
        .set('Bypass-Captcha', 'true')
        .field(
          'entity',
          JSON.stringify({
            title: 'my entity',
            template: allowedPublicTemplate.toString(),
          })
        )
        .attach('attachments[0]', path.join(__dirname, 'Hello, World.pdf'), 'Nombre en español')
        .field('attachments_originalname[0]', 'Nombre en español')
        .expect(500);

      await appContext.run(async () => {
        const myEntity = await entities.get({ title: 'my entity' });
        expect(myEntity.length).toBe(0);
      });
    });
  });
});
