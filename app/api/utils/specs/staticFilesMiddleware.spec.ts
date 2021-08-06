import request from 'supertest';
import express, { Application } from 'express';
import { setupTestUploadedPaths, uploadsPath, writeFile, attachmentsPath } from 'api/files';
import { staticFilesMiddleware } from '../staticFilesMiddleware';
import { testingTenants } from '../testingTenants';
import errorHandlingMiddleware from '../error_handling_middleware';

jest.mock('api/utils/AppContext');

describe('static file middleware', () => {
  const app: Application = express();
  app.get('/static-files/:fileName', staticFilesMiddleware([uploadsPath, attachmentsPath]));
  app.use(errorHandlingMiddleware);
  beforeEach(async () => {
    testingTenants.mockCurrentTenant({ name: 'default' });
    await setupTestUploadedPaths();
  });

  it('should return file requested', async () => {
    await writeFile(uploadsPath('staticFilesMiddleware.extension'), 'test text');

    const response = await request(app)
      .get('/static-files/staticFilesMiddleware.extension')
      .expect(200);

    expect(response.body instanceof Buffer).toBe(true);
    expect(response.body.toString()).toBe('test text');
  });

  describe('when multiple file paths passed', () => {
    it('should try to send file from any of them', async () => {
      await writeFile(attachmentsPath('attachment.extension'), 'test text');

      const response = await request(app)
        .get('/static-files/attachment.extension')
        .expect(200);

      expect(response.body instanceof Buffer).toBe(true);
      expect(response.body.toString()).toBe('test text');
    });
  });

  describe('when the file does not exist', () => {
    it('should return an error', async () => {
      await request(app)
        .get('/static-files/does-not-exists.extension')
        .expect(404);
    });
  });
});
