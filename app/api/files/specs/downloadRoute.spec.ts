import settings from 'api/settings/settings';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { setUpApp } from 'api/utils/testingRoutes';
import { testingTenants } from 'api/utils/testingTenants';
import { Application, NextFunction, Request, Response } from 'express';
// eslint-disable-next-line node/no-restricted-import
import privateInstanceMiddleware from 'api/auth/privateInstanceMiddleware';
import path from 'path';
import request, { Response as SuperTestResponse } from 'supertest';
import uploadRoutes from '../routes';
import {
  adminUser,
  collabInGroupUser,
  collabUser,
  customPdfFileName,
  downloadFixtures,
  fileOnPublicEntity,
  fixtures,
  fixturesFactory,
  mainDocument1,
  restrictedFileName,
  writerUser,
} from './fixtures';

const setAppWithUser = (routes: any, user: any) => {
  testingEnvironment.setPermissions(user);
  return setUpApp(routes, (req: Request, _res: Response, next: NextFunction) => {
    (req as any).user = user;
    next();
  });
};

describe('files routes download', () => {
  let app: Application;
  const deprecatedEndpoint = '/api/files';

  beforeAll(async () => {
    app = setUpApp(uploadRoutes);
    await testingEnvironment.setUp(fixtures);
    await testingEnvironment.setupTenantTmpPaths(fixtures.files || []);
  });

  afterAll(async () => testingEnvironment.tearDown());

  describe('GET files/', () => {
    it('should return 404 for non document/attachment files', async () => {
      const customResponse = await request(app).get(`/files/${customPdfFileName}`);
      const thumbnailResponse = await request(app).get('/files/thumbnail.jpg');

      expect(customResponse).toHaveStatus(404);
      expect(thumbnailResponse).toHaveStatus(404);
    });
  });

  describe.each([
    { file: downloadFixtures.mainDoc, endpoint: deprecatedEndpoint },
    { file: downloadFixtures.customPDF, endpoint: deprecatedEndpoint },
    { file: downloadFixtures.publicEntityFile, endpoint: deprecatedEndpoint },
    { file: downloadFixtures.thumbnail, endpoint: deprecatedEndpoint },

    { file: downloadFixtures.mainDoc, endpoint: '/files' },
    { file: downloadFixtures.attachment, endpoint: '/files' },
    { file: downloadFixtures.publicEntityFile, endpoint: '/files' },

    { file: downloadFixtures.thumbnail, endpoint: '/files/thumbnails' },

    { file: downloadFixtures.customPDF, endpoint: '/assets' },
  ])('Get $endpoint, $file.filename', ({ file, endpoint }) => {
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

  describe.each([
    {
      file: { filename: 'unexistent.pdf' },
      endpoint: deprecatedEndpoint,
      desc: 'when not in db',
    },
    {
      file: { filename: 'fileNotOnDisk' },
      endpoint: deprecatedEndpoint,
      desc: 'when not in disk',
    },
    {
      file: { filename: restrictedFileName },
      endpoint: deprecatedEndpoint,
      desc: 'when permissions restricted',
    },

    {
      file: { filename: 'unexistent.pdf' },
      endpoint: '/files',
      desc: 'when not in db',
    },
    {
      file: { filename: 'fileNotOnDisk' },
      endpoint: '/files',
      desc: 'when not in disk',
    },
    {
      file: { filename: restrictedFileName },
      endpoint: '/files',
      desc: 'when permissions restricted',
    },
    {
      file: downloadFixtures.thumbnail,
      endpoint: '/files',
      desc: '',
    },
    {
      file: downloadFixtures.thumbnail,
      endpoint: '/files',
      desc: 'when not the type allowed',
    },
    {
      file: downloadFixtures.mainDoc,
      endpoint: '/files/thumbnails',
      desc: 'when not the type allowed',
    },
    {
      file: downloadFixtures.mainDoc,
      endpoint: '/assets',
      desc: 'when not the type allowed',
    },
  ])('GET $endpoint $file.filename, $desc', ({ file, endpoint }) => {
    it('should respond with 404', async () => {
      app = setAppWithUser(uploadRoutes, collabUser);
      const response = await request(app).get(path.join(endpoint, file.filename));
      expect(response).toHaveStatus(404);
    });
  });

  describe.each([
    { file: { filename: restrictedFileName }, endpoint: deprecatedEndpoint },
    { file: { filename: restrictedFileName }, endpoint: '/files' },
    {
      file: downloadFixtures.restrictedThumbnail,
      endpoint: '/files/thumbnails',
    },
  ])('GET Permissions $endpoint $file.filename', ({ endpoint, file }) => {
    describe('when the related entity is restricted by permissions', () => {
      it('should return the file if the user has permission', async () => {
        app = setAppWithUser(uploadRoutes, writerUser);
        const response: SuperTestResponse = await request(app).get(
          path.join(endpoint, file.filename)
        );

        expect(response).toHaveStatus(200);
        expect(response.body instanceof Buffer).toBe(true);
      });

      it('should return the file if the user belongs to a group with permissions', async () => {
        app = setAppWithUser(uploadRoutes, {
          ...collabInGroupUser,
          groups: [{ _id: fixturesFactory.id('group 1') }],
        });
        const response: SuperTestResponse = await request(app).get(
          path.join(endpoint, file.filename)
        );

        expect(response).toHaveStatus(200);
        expect(response.body instanceof Buffer).toBe(true);
      });

      it('should allow an admin to access regardless of permissions', async () => {
        app = setAppWithUser(uploadRoutes, adminUser);
        const response: SuperTestResponse = await request(app).get(
          path.join(endpoint, file.filename)
        );

        expect(response).toHaveStatus(200);
        expect(response.body instanceof Buffer).toBe(true);
      });
    });
  });

  describe('Cache-Control and Last-Modified headers', () => {
    beforeEach(async () => {
      testingTenants.changeCurrentTenant({
        featureFlags: { fileCacheHeaders: true },
      });
    });

    describe('when instance is public', () => {
      beforeEach(async () => {
        await settings.save({ private: false });
        testingEnvironment.userInContextMockFactory.mock(undefined);
        app = setUpApp(uploadRoutes);
      });

      it.each([
        { endpoint: deprecatedEndpoint },
        { endpoint: '/files' },
        { endpoint: '/files/thumbnails', file: downloadFixtures.thumbnail },
        { endpoint: '/assets', file: downloadFixtures.customPDF },
      ])(
        'should set "public, no-cache" for documents from published entities accessed without authentication $endpoint',
        async ({ endpoint, file }) => {
          const response = await request(app).get(
            path.join(endpoint, file?.filename || fileOnPublicEntity)
          );

          expect(response).toHaveStatus(200);
          expect(response.get('Cache-Control')).toBe('public, no-cache');
        }
      );

      it.each([
        { endpoint: deprecatedEndpoint },
        { endpoint: '/files' },
        { endpoint: '/files/thumbnails', file: downloadFixtures.thumbnail },
        { endpoint: '/assets', file: downloadFixtures.customPDF },
      ])(
        'should set Last-Modified header based on file creationDate ($endpoint)',
        async ({ endpoint, file }) => {
          const response = await request(app).get(
            path.join(endpoint, file?.filename || fileOnPublicEntity)
          );

          expect(response).toHaveStatus(200);
          await expect(response.get('Last-Modified')).toMatch(/GMT$/);
        }
      );
    });

    describe('when accessed by authenticated user', () => {
      beforeEach(async () => {
        await settings.save({ private: false });
        app = setAppWithUser(uploadRoutes, adminUser);
      });

      it.each([
        { endpoint: deprecatedEndpoint, file: downloadFixtures.mainDoc },
        { endpoint: '/files', file: downloadFixtures.mainDoc },
        { endpoint: deprecatedEndpoint, file: downloadFixtures.attachment },
        { endpoint: '/files', file: downloadFixtures.attachment },
        { endpoint: '/files/thumbnails', file: downloadFixtures.thumbnail },
        { endpoint: deprecatedEndpoint, file: downloadFixtures.customPDF },
        { endpoint: '/assets', file: downloadFixtures.customPDF },
      ])(
        'should set Last-Modified and "private, max-age=3600" ($endpoint/$file.filename)',
        async ({ endpoint, file }) => {
          const response = await request(app).get(path.join(endpoint, file.filename));

          expect(response).toHaveStatus(200);
          expect(response.get('Cache-Control')).toBe('private, max-age=3600');
          expect(response.get('Last-Modified')).toBeDefined();
        }
      );
    });

    describe('when instance is private and no authenticated user', () => {
      beforeEach(async () => {
        await settings.save({ private: true });
        testingEnvironment.userInContextMockFactory.mock(undefined);
        app = setUpApp(uploadRoutes, privateInstanceMiddleware);
      });

      it.each([
        { endpoint: deprecatedEndpoint, file: downloadFixtures.mainDoc },
        { endpoint: deprecatedEndpoint, file: downloadFixtures.customPDF },
        { endpoint: deprecatedEndpoint, file: downloadFixtures.attachment },

        { endpoint: '/files', file: downloadFixtures.mainDoc },
        { endpoint: '/files', file: downloadFixtures.attachment },
        { endpoint: '/files/thumbnails', file: downloadFixtures.thumbnail },
        { endpoint: '/assets', file: downloadFixtures.customPDF },
      ])('should respond unauthorized 401 ($endpoint)', async ({ endpoint, file }) => {
        const response = await request(app).get(path.join(endpoint, file.filename));
        expect(response).toHaveStatus(401);
      });
    });

    describe('when feature flag is disabled', () => {
      beforeEach(async () => {
        testingTenants.changeCurrentTenant({
          featureFlags: { fileCacheHeaders: false },
        });
        await settings.save({ private: false });
        testingEnvironment.userInContextMockFactory.mockEditorUser();
        app = setUpApp(uploadRoutes);
      });

      it.each([
        { endpoint: deprecatedEndpoint },
        { endpoint: '/files' },
        { endpoint: '/files/thumbnails', file: downloadFixtures.thumbnail },
        { endpoint: '/assets', file: downloadFixtures.customPDF },
      ])(
        'should not set Cache-Control and Last-Modifeid headers ($endpoint)',
        async ({ endpoint, file }) => {
          const response = await request(app).get(
            path.join(endpoint, file?.filename || mainDocument1)
          );

          expect(response).toHaveStatus(200);
          expect(response.get('Cache-Control')).toBeUndefined();
          expect(response.get('Last-Modified')).toBeUndefined();
        }
      );
    });
  });
});
