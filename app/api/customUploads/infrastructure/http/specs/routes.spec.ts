import { Application, NextFunction, Request, Response } from 'express';
import path from 'path';
import request, { Response as SuperTestResponse } from 'supertest';
import { setUpApp } from 'api/utils/testingRoutes';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { UserSchema } from 'shared/types/userType';
import { files } from 'api/files/files';
import { FileType } from 'shared/types/fileType';
import { customUploadsPath } from 'api/files';
// eslint-disable-next-line node/no-restricted-import
import fs from 'fs/promises';
import customUploadsRoutes from '../routes';
import { adminUser, downloadFixtures, fixtures } from 'api/files/specs/fixtures';

jest.mock(
  'api/auth/authMiddleware.ts',
  () => () => (_req: Request, _res: Response, next: NextFunction) => {
    next();
  }
);

describe('custom uploads routes', () => {
  let requestMockedUser: UserSchema = adminUser;

  const app: Application = setUpApp(
    customUploadsRoutes,
    (req: Request, _res: Response, next: NextFunction) => {
      (req as any).user = (() => requestMockedUser)();
      next();
    }
  );

  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures);
    await testingEnvironment.setupTenantTmpPaths(fixtures.files || []);
  });

  afterAll(async () => testingEnvironment.tearDown());

  describe('POST /api/files/upload/custom', () => {
    it('should save the upload and return it', async () => {
      const response: SuperTestResponse = await request(app)
        .post('/api/files/upload/custom')
        .attach('file', path.join(__dirname, '../../../../files/specs/test.txt'));

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
        .attach('file', path.join(__dirname, '../../../../files/specs/test.txt'));

      const [file]: FileType[] = await files.get({ originalname: 'test.txt' });

      expect(await fs.readFile(customUploadsPath(file.filename || ''))).toBeDefined();
    });
  });

  describe('GET /assets/:filename', () => {
    const file = downloadFixtures.customPDF;
    const endpoint = '/assets';

    it('should get the file', async () => {
      const response = await request(app).get(path.join(endpoint, file.filename));

      expect(response.status).toBe(200);
      expect(response.body instanceof Buffer).toBe(true);
    });

    it('should set the original filename as Content-Disposition header', async () => {
      const response = await request(app).get(path.join(endpoint, file.filename));

      expect(response).toHaveStatus(200);
      expect(response.get('Content-Disposition')).toBe(
        `filename*=UTF-8''${encodeURIComponent(file.originalname)}`
      );
    });

    describe('?download=true', () => {
      it('should set proper "attachment" in the Content-Disposition', async () => {
        const response = await request(app).get(
          `${path.join(endpoint, file.filename)}?download=true`
        );

        expect(response.get('Content-Disposition')).toBe(
          `attachment; filename*=UTF-8''${encodeURIComponent(file.originalname)}`
        );
      });
    });
  });
});
