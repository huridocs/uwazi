import type { Application, NextFunction, Request, Response } from 'express';
import os from 'os';
import path from 'path';
import request from 'supertest';
// eslint-disable-next-line node/no-restricted-import
import fs from 'fs/promises';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { setupTestUploadedPaths, storage } from '#api/files/index.js';
import { search } from '#api/search/index.js';
import { setUpApp } from '#api/utils/testingRoutes.js';
import { PUBLIC_USER_ID } from '#api/users/publicUser.js';
import { fixtures, templateId, writerUser } from './fixtures.js';
import { routes } from '../jsRoutes.js';

jest.mock(
  '../../auth/authMiddleware.ts',
  () => () => (_req: Request, _res: Response, next: NextFunction) => {
    next();
  }
);

jest.mock(
  '../../auth/captchaMiddleware.ts',
  () => () => (_req: Request, _res: Response, next: NextFunction) => {
    next();
  }
);

describe('public routes', () => {
  const app: Application = setUpApp(routes);

  beforeEach(async () => {
    jest.spyOn(search, 'indexEntities').mockImplementation(async () => Promise.resolve());
    jest.spyOn(Date, 'now').mockReturnValue(1000);
    await testingEnvironment.setUp(fixtures);
    await setupTestUploadedPaths();
  });

  afterAll(async () => testingEnvironment.tearDown());

  describe('POST /api/public', () => {
    // eslint-disable-next-line max-statements
    it('should create the entity and store the files', async () => {
      await fs.writeFile(path.join(os.tmpdir(), 'attachment.txt'), 'attachment');

      const response = await request(app)
        .post('/api/public')
        .field(
          'entity',
          JSON.stringify({ title: 'public submit', template: templateId.toString() })
        )
        .attach('file', `${__dirname}/12345.test.pdf`)
        .attach(
          'attachments[0]',
          path.join(os.tmpdir(), 'attachment.txt'),
          'filename with special char ñ.txt'
        )
        .field('attachments_originalname[0]', 'filename with special char ñ.txt')
        .expect(200);

      const { sharedId } = response.body;

      const [newEntity] = await testingEnvironment.db
        .getCollection('entities')!
        .find({ sharedId, language: 'es' })
        .toArray();

      const files = await testingEnvironment.db
        .getCollection('files')!
        .find({ entity: newEntity.sharedId })
        .toArray();

      const documents = files.filter((f: any) => f.type === 'document');
      const attachments = files.filter((f: any) => f.type === 'attachment');

      const textAttachment = attachments.find(
        (attachment: any) => attachment.originalname === 'filename with special char ñ.txt'
      );
      expect(textAttachment).not.toBeUndefined();
      expect(await storage.fileExists(textAttachment?.filename!, 'attachment')).toBe(true);

      const [document] = documents;
      expect(document).toEqual(
        expect.objectContaining({ originalname: '12345.test.pdf', status: 'processing' })
      );
      expect(await storage.fileExists(document.filename!, 'document')).toBe(true);
    });

    it('should set req.user to Public user when not authenticated', async () => {
      let capturedUser: any = null;

      const appWithSpy: Application = setUpApp(
        routes,
        (req: Request, res: Response, next: NextFunction) => {
          res.on('finish', () => {
            capturedUser = req.user;
          });
          next();
        }
      );

      await request(appWithSpy)
        .post('/api/public')
        .field(
          'entity',
          JSON.stringify({ title: 'test req.user', template: templateId.toString() })
        )
        .expect(200);

      expect(capturedUser).toBeDefined();
      expect(capturedUser._id.toString()).toBe(PUBLIC_USER_ID.toString());
      expect(capturedUser.username).toBe('PublicUser');
    });

    it('should not overwrite req.user when user is authenticated', async () => {
      let capturedUser: any = null;

      const appWithAuthenticatedUser: Application = setUpApp(
        routes,
        (req: Request, res: Response, next: NextFunction) => {
          req.user = writerUser;

          res.on('finish', () => {
            capturedUser = req.user;
          });
          next();
        }
      );

      await request(appWithAuthenticatedUser)
        .post('/api/public')
        .field(
          'entity',
          JSON.stringify({
            title: 'test authenticated user',
            template: templateId.toString(),
          })
        )
        .expect(200);

      expect(capturedUser).toBeDefined();
      expect(capturedUser._id.toString()).toBe(writerUser._id.toString());
      expect(capturedUser.username).toBe(writerUser.username);
      expect(capturedUser._id.toString()).not.toBe(PUBLIC_USER_ID.toString());
    });
  });
});
