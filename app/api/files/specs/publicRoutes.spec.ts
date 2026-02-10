import { testingEnvironment } from 'api/utils/testingEnvironment';
import { Application, NextFunction, Request, Response } from 'express';
import os from 'os';
import path from 'path';
import request from 'supertest';

import { setupTestUploadedPaths, storage } from 'api/files';
import { search } from 'api/search';
import mailer from 'api/utils/mailer';
import { setUpApp } from 'api/utils/testingRoutes';
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
