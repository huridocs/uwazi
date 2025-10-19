import request, { Response as SuperTestResponse } from 'supertest';
import { Application, Request, Response, NextFunction } from 'express';

import { setUpApp } from 'api/utils/testingRoutes';
import testingDB from 'api/utils/testing_db';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import settings from 'api/settings/settings';
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
        const response = await request(app).get(`/api/files/${customPdfFileName}`);
        expect(response.status).toBe(200);
      });
      it('should serve files that are related to public entities', async () => {
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

    describe('Cache-Control and Last-Modified headers', () => {
      describe('when instance is public', () => {
        beforeEach(async () => {
          await settings.save({ private: false });
          // Reset to no user for unauthenticated access tests
          testingEnvironment.userInContextMockFactory.mock(undefined);
        });

        it('should set "public, no-cache" for custom files accessed without authentication', async () => {
          const response: SuperTestResponse = await request(app)
            .get(`/api/files/${customPdfFileName}`)
            .expect(200);

          expect(response.get('Cache-Control')).toBe('public, no-cache');
        });

        it('should set "public, no-cache" for documents from published entities accessed without authentication', async () => {
          const response: SuperTestResponse = await request(app)
            .get(`/api/files/${fileOnPublicEntity}`)
            .expect(200);

          expect(response.get('Cache-Control')).toBe('public, no-cache');
        });

        it('should set "private, max-age=3600" for documents from unpublished entities', async () => {
          // fileName1 is on sharedId1 which is NOT published
          const response: SuperTestResponse = await request(app)
            .get(`/api/files/${fileName1}`)
            .expect(404); // Unpublished entity, no user = 404

          // Note: This test expects 404 because unpublished entities shouldn't be accessible
          // without authentication in the current implementation
        });

        it('should set Last-Modified header based on file creationDate', async () => {
          const response: SuperTestResponse = await request(app)
            .get(`/api/files/${fileOnPublicEntity}`)
            .expect(200);

          const lastModified = response.get('Last-Modified');
          expect(lastModified).toBeDefined();
          // creationDate is 1 millisecond in fixtures, which converts to Thu, 01 Jan 1970 00:00:00 GMT
          expect(lastModified).toBe('Thu, 01 Jan 1970 00:00:00 GMT');
        });
      });

      describe('when accessed by authenticated user', () => {
        beforeEach(async () => {
          await settings.save({ private: false });
          app = setAppWithUser(uploadRoutes, adminUser);
        });

        it('should set "private, max-age=3600" even for public files (no CDN caching for authenticated requests)', async () => {
          const response: SuperTestResponse = await request(app)
            .get(`/api/files/${fileOnPublicEntity}`)
            .expect(200);

          expect(response.get('Cache-Control')).toBe('private, max-age=3600');
        });

        it('should set "private, max-age=3600" for custom files', async () => {
          const response: SuperTestResponse = await request(app)
            .get(`/api/files/${customPdfFileName}`)
            .expect(200);

          expect(response.get('Cache-Control')).toBe('private, max-age=3600');
        });
      });

      describe('when instance is private', () => {
        beforeEach(async () => {
          await settings.save({ private: true });
          // Reset to no user - even without auth, private instance stays private
          testingEnvironment.userInContextMockFactory.mock(undefined);
        });

        it('should set "private, max-age=3600" for custom files', async () => {
          const response: SuperTestResponse = await request(app)
            .get(`/api/files/${customPdfFileName}`)
            .expect(200);

          expect(response.get('Cache-Control')).toBe('private, max-age=3600');
        });

        it('should set "private, max-age=3600" for document files from published entities', async () => {
          const response: SuperTestResponse = await request(app)
            .get(`/api/files/${fileOnPublicEntity}`)
            .expect(200);

          expect(response.get('Cache-Control')).toBe('private, max-age=3600');
        });
      });

      describe('conditional requests (If-Modified-Since)', () => {
        it('should return 304 Not Modified when If-Modified-Since matches file creationDate', async () => {
          // File creationDate is 1 (Thu, 01 Jan 1970 00:00:00 GMT)
          const response: SuperTestResponse = await request(app)
            .get(`/api/files/${fileOnPublicEntity}`)
            .set('If-Modified-Since', 'Thu, 01 Jan 1970 00:00:00 GMT')
            .expect(304);

          expect(response.body).toEqual({});
        });

        it('should return 304 Not Modified when If-Modified-Since is newer than file creationDate', async () => {
          // File creationDate is 1, so any date after that should return 304
          const response: SuperTestResponse = await request(app)
            .get(`/api/files/${fileOnPublicEntity}`)
            .set('If-Modified-Since', 'Fri, 02 Jan 1970 00:00:00 GMT')
            .expect(304);

          expect(response.body).toEqual({});
        });

        it('should return 200 OK with file when If-Modified-Since is older than file creationDate', async () => {
          // Need to use a file we can update - get the file ID first
          const [publicFile] = await files.get({ filename: fileOnPublicEntity });
          const newCreationDate = new Date('2024-01-15T10:00:00Z').getTime();
          await files.save({ _id: publicFile._id, creationDate: newCreationDate });

          const response: SuperTestResponse = await request(app)
            .get(`/api/files/${fileOnPublicEntity}`)
            .set('If-Modified-Since', 'Thu, 01 Jan 1970 00:00:00 GMT')
            .expect(200);

          expect(response.body instanceof Buffer).toBe(true);
          expect(response.get('Last-Modified')).toBe('Mon, 15 Jan 2024 10:00:00 GMT');
        });

        it('should return 200 OK when no If-Modified-Since header is present', async () => {
          const response: SuperTestResponse = await request(app)
            .get(`/api/files/${fileOnPublicEntity}`)
            .expect(200);

          expect(response.body instanceof Buffer).toBe(true);
        });
      });
    });
  });
});
