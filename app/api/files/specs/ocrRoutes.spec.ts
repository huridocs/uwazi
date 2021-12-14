import { Application, Request, Response, NextFunction } from 'express';
import fetchMock from 'fetch-mock';
import path from 'path';
import request from 'supertest';

import { fileExists, uploadsPath } from 'api/files/filesystem';
import relationships from 'api/relationships';
import { search } from 'api/search';
import { OcrManagerInstance } from 'api/services/ocr/OcrManager';
import settings from 'api/settings/settings';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { setUpApp } from 'api/utils/testingRoutes';
import JSONRequest from 'shared/JSONRequest';

import { fileName1, fixtures, uploadId } from './fixtures';
import { fs } from '..';
import { files } from '../files';
import ocrRoutes from '../ocrRoutes';
import { OcrModel, OcrStatus } from '../../services/ocr/ocrModel';
import { TaskManager } from '../../services/tasksmanager/TaskManager';
import { UserSchema } from 'shared/types/userType';

jest.mock('api/services/tasksmanager/TaskManager.ts');

describe('OCR service', () => {
  const collabUser = fixtures.users!.find(u => u.username === 'collab');
  const adminUser = fixtures.users!.find(u => u.username === 'admin');
  let requestMockedUser: UserSchema | undefined;

  const app: Application = setUpApp(
    ocrRoutes,
    (req: Request, _res: Response, next: NextFunction) => {
      (req as any).user = (() => requestMockedUser)();
      next();
    }
  );

  function setSupportedLang(langs: string[]) {
    fetchMock.mock(
      'protocol://serviceUrl/info',
      {
        supported_languages: langs,
      },
      { overwriteRoutes: true }
    );
  }

  beforeEach(async () => {
    spyOn(search, 'indexEntities').and.returnValue(Promise.resolve());
    await testingEnvironment.setUp(fixtures);
    testingEnvironment.setPermissions(adminUser);
    requestMockedUser = adminUser;
    jest.spyOn(Date, 'now').mockReturnValue(1000);
    // TODO: remove after migrating tests to own file
    await files.save({ ...fixtures.files![0], type: 'document' });
  });

  beforeAll(() => {
    OcrManagerInstance.start();
  });

  afterAll(async () => testingEnvironment.tearDown());

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
      expect(body).toEqual({ status: OcrStatus.PROCESSING, lastUpdated: 1000 });
    });

    // eslint-disable-next-line max-statements
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

      const connectionsForOrigFile = await relationships.get({
        file: originalFile._id.toHexString(),
      });
      const connectionsForResultFile = await relationships.get({
        file: resultFile._id.toHexString(),
      });

      expect(connectionsForOrigFile.length).toBe(0);
      expect(connectionsForResultFile.length).toBe(1);
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

    afterAll(async () => {
      await settings.save({ toggleOCRButton: true });
    });

    it('should not allow request status', async () => {
      await request(app).get(`/api/files/${fileName1}/ocr`).expect(404);
    });

    it('should not allow to create a task', async () => {
      await request(app).post(`/api/files/${fileName1}/ocr`).expect(404);
    });
  });

  describe('when the file is not a document', () => {
    it('should not allow request status if the file is unprocessed', async () => {
      await files.save({ _id: uploadId, type: 'attachment' });
      await request(app).get(`/api/files/${fileName1}/ocr`).expect(400);
    });

    it('should not allow to create a task', async () => {
      await files.save({ _id: uploadId, type: 'attachment' });
      await request(app).post(`/api/files/${fileName1}/ocr`).expect(400);
    });
  });
});
