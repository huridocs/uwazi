
import { testingEnvironment } from 'api/utils/testingEnvironment.js';
import { Application, NextFunction, Request, Response } from 'express';
import os from 'os';
import path from 'path';
// @ts-expect-error TS(2307): Cannot find module '../../shared/types/entityType.... Remove this comment to see the full error message
import { EntityWithFilesSchema } from 'shared/types/entityType.js';
import request from 'supertest';

// @ts-expect-error TS(2307): Cannot find module '../entities.js' or its corresp... Remove this comment to see the full error message
import entities from '../entities.js';
// @ts-expect-error TS(2305): Module '"../files.js"' has no exported member 'set... Remove this comment to see the full error message
import { setupTestUploadedPaths, storage } from '../files.js';
// @ts-expect-error TS(2307): Cannot find module '../search.js' or its correspon... Remove this comment to see the full error message
import { search } from '../search.js';
// @ts-expect-error TS(2307): Cannot find module '../utils/mailer.js' or its cor... Remove this comment to see the full error message
import mailer from '../utils/mailer.js';
// @ts-expect-error TS(2307): Cannot find module '../utils/testingRoutes.js' or ... Remove this comment to see the full error message
import { setUpApp, socketEmit } from '../utils/testingRoutes.js';
// eslint-disable-next-line node/no-restricted-import
import fs from 'fs/promises';
import { routes } from '../jsRoutes';
import { fixtures, templateId } from './fixtures';

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
    it('should create the entity and store the files', async () => {
      await fs.writeFile(path.join(os.tmpdir(), 'attachment.txt'), 'attachment');

      await socketEmit('documentProcessed', async () =>
        request(app)
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
          .expect(200)
      );

      const [newEntity] = (await entities.get({
        title: 'public submit',
      })) as EntityWithFilesSchema[];

      const textAttachment = (newEntity.attachments || []).find(
        // @ts-expect-error TS(7006): Parameter 'attachment' implicitly has an 'any' typ... Remove this comment to see the full error message
        attachment => attachment.originalname === 'filename with special char ñ.txt'
      );
      expect(textAttachment).not.toBeUndefined();
      expect(await storage.fileExists(textAttachment?.filename!, 'attachment')).toBe(true);

      const [document] = newEntity.documents!;
      expect(document).toEqual(
        expect.objectContaining({ originalname: '12345.test.pdf', status: 'ready' })
      );
      expect(await storage.fileExists(document.filename!, 'document')).toBe(true);
    });

    it('should send an email', async () => {
      jest.spyOn(mailer, 'send').mockImplementation(async () => Promise.resolve());
      await request(app)
        .post('/api/public')
        .field(
          'email',
          JSON.stringify({
            from: 'test',
            to: 'batman@gotham.com',
            subject: 'help!',
            text: 'The joker is back!',
          })
        )
        .field(
          'entity',
          JSON.stringify({
            title: 'test',
            template: templateId.toString(),
          })
        )
        .expect(200);

      expect(mailer.send).toHaveBeenCalledWith({
        from: 'test',
        subject: 'help!',
        text: 'The joker is back!',
        to: 'batman@gotham.com',
      });
    });
  });
});
