/* eslint-disable max-lines */
import fetchMock from 'fetch-mock';
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
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { fileName1, fixtures, uploadId, uploadId2 } from './fixtures';
import { files } from '../files';
import uploadRoutes from '../routes';
import { OcrModel, OcrStatus } from '../../services/ocr/ocrModel';
import { TaskManager } from '../../services/tasksmanager/TaskManager';
import { fs } from '..';
import settings from 'api/settings/settings';

jest.mock('api/services/tasksmanager/TaskManager.ts');

describe('files routes', () => {
  const collabUser = fixtures.users!.find(u => u.username === 'collab');
  const adminUser = fixtures.users!.find(u => u.username === 'admin');
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

    describe('when external url file', () => {
      it('should request and store the mimetype', async () => {
        const headers = new Headers();
        headers.set('content-type', 'image/png');

        jest
          .spyOn(JSONRequest, 'head')
          .mockResolvedValue({ json: () => {}, headers, status: 200, cookie: null });

        await request(app)
          .post('/api/files')
          .send({ url: 'https://awesomecats.org/ahappycat.png', originalname: 'A Happy Cat' });

        const [file]: FileType[] = await files.get({ originalname: 'A Happy Cat' });
        expect(file.mimetype).toBe('image/png');
      });

      it('should return a validation error for a no secured url', async () => {
        const headers = new Headers();
        headers.set('content-type', 'image/png');

        const rest = await request(app)
          .post('/api/files')
          .send({ url: 'http://awesomecats.org/ahappycat.png', originalname: 'A Happy Cat' });

        expect(rest.status).toBe(400);
      });
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

      await request(app).delete('/api/files').query({ _id: file._id?.toString() });

      expect(await fileExists(customUploadsPath(file.filename || ''))).toBe(false);
    });

    it('should reindex all entities that are related to the files deleted', async () => {
      await request(app).delete('/api/files').query({ _id: uploadId2.toString() });

      expect(search.indexEntities).toHaveBeenCalledWith(
        { sharedId: { $in: ['sharedId1'] } },
        '+fullText'
      );
    });

    it('should delete all connections related to the file', async () => {
      await request(app).delete('/api/files').query({ _id: uploadId2.toString() });

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

  describe('OCR service', () => {
    function setSupportedLang(langs: string[]) {
      fetchMock.mock(
        'protocol://serviceUrl/info',
        {
          supported_languages: langs,
        },
        { overwriteRoutes: true }
      );
    }

    beforeEach(() => {
      testingEnvironment.setPermissions(adminUser);
      requestMockedUser = adminUser;
    });

    it('should return the status on get', async () => {
      setSupportedLang(['en']);
      const { body } = await request(app).get(`/api/files/${fileName1}/ocr`).expect(200);

      expect(body).toEqual({
        status: OcrStatus.NONE,
      });
    });

    it('should return unsupported_language on status get', async () => {
      setSupportedLang(['es']);
      const { body } = await request(app).get(`/api/files/${fileName1}/ocr`).expect(200);

      expect(body).toEqual({
        status: OcrStatus.UNSUPPORTED_LANGUAGE,
      });
    });

    describe('when posting a task', () => {
      beforeEach(async () => {
        setSupportedLang(['en']);
        jest.spyOn(JSONRequest, 'uploadFile').mockReturnValue(Promise.resolve());
        const resultTestFile = fs.createReadStream(
          path.join(__dirname, 'uploads/f2082bf51b6ef839690485d7153e847a.pdf')
        );
        fetchMock.mock(
          'protocol://link/to/result/file',
          {
            body: resultTestFile,
            headers: { 'Content-Type': 'application/pdf', 'Content-Length': 1000 },
          },
          { sendAsJson: false, overwriteRoutes: true }
        );

        await request(app).post(`/api/files/${fileName1}/ocr`).expect(200);
      });

      it('should set the status to processing', async () => {
        const { body } = await request(app).get(`/api/files/${fileName1}/ocr`).expect(200);
        expect(body).toEqual({ status: OcrStatus.PROCESSING });
      });

      it('should process a successful OCR', async () => {
        // @ts-ignore
        await TaskManager.mock.calls[0][0].processResults({
          tenant: 'defaultDB',
          task: 'ocr_results',
          file_url: 'protocol://link/to/result/file',
          params: { filename: fileName1, language: 'en' },
          success: true,
        });

        const [originalFile] = await files.get({ filename: fileName1 });
        const [record] = await OcrModel.get({ sourceFile: originalFile._id });
        const [resultFile] = await files.get({ _id: record.resultFile });

        expect(record.status).toBe(OcrStatus.READY);
        expect(originalFile.type).toBe('attachment');
        expect(await fileExists(uploadsPath(originalFile.filename))).toBe(true);
        expect(resultFile.type).toBe('document');
        expect(await fileExists(uploadsPath(resultFile.filename))).toBe(true);
        expect(resultFile.language).toBe(originalFile.language);
      });

      it('should move the text references to the new file', () => {
        fail('TODO');
      });
    });

    it('should fail if the file does not exist', async () => {
      await request(app).get('/api/files/invalidFile/ocr').expect(404);

      await request(app).post('/api/files/invalidFile/ocr').expect(404);
    });

    describe('when the user is not an admin or editor', () => {
      beforeEach(() => {
        testingEnvironment.setPermissions(collabUser);
        requestMockedUser = collabUser;
      });

      it('should not allow request status', async () => {
        await request(app).get(`/api/files/${fileName1}/ocr`).expect(401);
      });

      it('should not allow to create a task', async () => {
        await request(app).post(`/api/files/${fileName1}/ocr`).expect(401);
      });
    });

    describe('when the feature is not enabled', () => {
      beforeEach(async () => {
        await settings.save({ toggleOCRButton: false });
      });

      it('should not allow request status', async () => {
        await request(app).get(`/api/files/${fileName1}/ocr`).expect(404);
      });

      it('should not allow to create a task', async () => {
        await request(app).post(`/api/files/${fileName1}/ocr`).expect(404);
      });
    });

    describe('when the file is not a document', () => {
      beforeEach(async () => {
        await settings.save({ toggleOCRButton: false });
      });

      it('should not allow request status', async () => {
        fail('TODO');
      });

      it('should not allow to create a task', async () => {
        fail('TODO')
      });
    });
  });
});
