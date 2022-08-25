import path from 'path';
import os from 'os';
import request from 'supertest';
import { Application, Request, Response, NextFunction } from 'express';
import { EntityWithFilesSchema } from 'shared/types/entityType';

import { search } from 'api/search';
import db from 'api/utils/testing_db';
import { errorLog } from 'api/log';
import { setupTestUploadedPaths, storage } from 'api/files';
import { setUpApp, socketEmit } from 'api/utils/testingRoutes';
import entities from 'api/entities';
import mailer from 'api/utils/mailer';
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
    spyOn(search, 'indexEntities').and.callFake(async () => Promise.resolve());
    spyOn(Date, 'now').and.returnValue(1000);
    spyOn(errorLog, 'error');
    await db.clearAllAndLoad(fixtures);
    await setupTestUploadedPaths();
  });

  afterAll(async () => db.disconnect());

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
      spyOn(mailer, 'send');
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
