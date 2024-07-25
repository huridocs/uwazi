import request, { Response as SuperTestResponse } from 'supertest';
import { Application, Request, Response, NextFunction } from 'express';

import { setUpApp } from 'api/utils/testingRoutes';
import testingDB from 'api/utils/testing_db';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import {
  fixtures,
  fileName1,
  restrictedFileName,
  uploadId,
  collabUser,
  writerUser,
  adminUser,
  customPdfFileName,
  fileOnPublicEntity,
} from './fixtures';

import uploadRoutes from '../routes';
import { files } from '../files';

const setAppWithUser = (routes: any, user: any) => {
  testingEnvironment.setPermissions(user);
  return setUpApp(routes, (req: Request, _res: Response, next: NextFunction) => {
    (req as any).user = user;
    next();
  });
};

describe('files routes download', () => {
  let app: Application;

  beforeEach(async () => {
    app = setUpApp(uploadRoutes);
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => testingEnvironment.tearDown());

  describe('GET/', () => {
    it.each([fileName1, customPdfFileName])('should send the file (%s)', async filename => {
      const response = await request(app).get(`/api/files/${filename}`);

      expect(response.status).toBe(200);
      expect(response.body instanceof Buffer).toBe(true);
    });

    it('should set the original filename as content-disposition header', async () => {
      const response: SuperTestResponse = await request(app)
        .get(`/api/files/${fileName1}`)
        .expect(200);

      expect(response.get('Content-Disposition')).toBe("filename*=UTF-8''upload1");
    });

    it('should set the original filename as content-disposition header', async () => {
      const response: SuperTestResponse = await request(app)
        .get(`/api/files/${fileName1}/?download=true`)
        .expect(200);

      expect(response.get('Content-Disposition')).toBe("attachment; filename*=UTF-8''upload1");
    });

    it('should properly uri encode original names', async () => {
      await files.save({ _id: uploadId, originalname: '테스트 한글chinese-file' });

      const response: SuperTestResponse = await request(app)
        .get(`/api/files/${fileName1}`)
        .expect(200);

      expect(response.get('Content-Disposition')).toBe(
        `filename*=UTF-8''${encodeURIComponent('테스트 한글chinese-file')}`
      );
    });

    it('should not set content-disposition header when the file does not have an original name', async () => {
      const response: SuperTestResponse = await request(app)
        .get('/api/files/fileNotInDisk')
        .expect(404);

      expect(response.get('Content-Disposition')).toBeUndefined();
    });

    describe('when file entry does not exist', () => {
      it('should respond with 404', async () => {
        const response = await request(app)
          .get('/api/files/unexistent.pdf')
          .query({ _id: testingDB.id().toString() });

        expect(response.status).toBe(404);
      });
    });

    describe('when disk file does not exist', () => {
      it('should respond with 404', async () => {
        const response = await request(app)
          .get('/api/files/fileNotOnDisk')
          .query({ _id: testingDB.id().toString() });

        expect(response.status).toBe(404);
      });
    });

    describe('when there is no user logged in', () => {
      it('should serve custom files', async () => {
        testingEnvironment.resetPermissions();
        const response = await request(app).get(`/api/files/${customPdfFileName}`);

        expect(response.status).toBe(200);
      });
      it('should serve files that are related to public entities', async () => {
        testingEnvironment.resetPermissions();
        const response = await request(app).get(`/api/files/${fileOnPublicEntity}`);

        expect(response.status).toBe(200);
      });
    });

    describe('when the related entity is restricted by permissions', () => {
      it('should return a 404 if the user does not have permission', async () => {
        app = setAppWithUser(uploadRoutes, collabUser);
        const response = await request(app).get(`/api/files/${restrictedFileName}`);
        expect(response.status).toBe(404);
      });

      it('should return the file if the user has permission', async () => {
        app = setAppWithUser(uploadRoutes, writerUser);
        const response: SuperTestResponse = await request(app).get(
          `/api/files/${restrictedFileName}`
        );

        expect(response.status).toBe(200);
        expect(response.body instanceof Buffer).toBe(true);
      });

      it('should allow an admin to access regardless of permissions', async () => {
        app = setAppWithUser(uploadRoutes, adminUser);
        const response: SuperTestResponse = await request(app)
          .get(`/api/files/${restrictedFileName}`)
          .expect(200);

        expect(response.body instanceof Buffer).toBe(true);
      });
    });
  });
});
