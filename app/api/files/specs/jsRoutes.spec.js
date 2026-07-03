import express from 'express';
import request from 'supertest';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { PUBLIC_USER_ID } from '#api/core/domain/user/User.js';
import { setUpApp } from '#api/utils/testingRoutes.js';
import { appContext } from '#api/utils/AppContext.js';
import mailer from '#api/utils/mailer.js';
import entities from '#api/entities/index.js';
import { search } from '#api/search/index.js';
import { settingsModel } from '#api/settings/settingsModel.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import uploadRoutes from '../jsRoutes.js';
import { allowedPublicTemplate, fixtures, templateId, writerUser } from './fixtures.js';
import { legacyLogger } from '../../log.js';

const mockExport = jest.fn();
jest.mock('api/csv/csvExporter', () =>
  jest.fn().mockImplementation(() => ({ export: mockExport }))
);

jest.mock('../../auth/captchaMiddleware.ts', () => () => (_req, _res, next) => {
  next();
});

// eslint-disable-next-line max-statements
describe('upload routes', () => {
  let app;
  let baseReq;
  let user = writerUser;

  beforeEach(async () => {
    jest.spyOn(search, 'delete').mockImplementation(async () => Promise.resolve());
    jest.spyOn(search, 'indexEntities').mockImplementation(async () => Promise.resolve());

    user = writerUser;
    app = setUpApp(uploadRoutes, (req, _res, next) => {
      req.user = user;
      next();
    });

    baseReq = {
      language: 'es',
      user: 'admin',
      headers: {},
      body: { document: 'sharedId1' },
    };
    await testingEnvironment.setUp(fixtures);
    jest.spyOn(legacyLogger, 'error'); //just to avoid annoying console outpu.mockImplementation(() => {});
  });

  describe('api/public', () => {
    beforeEach(async () => {
      // Restore appContext.set so production code can set the Public user in context
      if (jest.isMockFunction(appContext.set)) {
        appContext.set.mockRestore();
      }

      jest.spyOn(Date, 'now').mockReturnValue(1000);
      jest.spyOn(mailer, 'send').mockImplementation(() => {});

      baseReq = {
        language: 'es',
        headers: {},
        body: {
          entity: { title: 'public submit', template: templateId.toString() },
        },
        io: {},
      };
    });

    it('should create an Entity and return the created Entity on body response', async () => {
      testingEnvironment.resetPermissions();
      user = undefined; // To test that the Public user is used when no user is authenticated

      const response = await request(app)
        .post('/api/public')
        .field('entity', JSON.stringify(baseReq.body.entity));

      expect(response.body).toEqual({
        _id: expect.any(String),
        title: baseReq.body.entity.title,
        language: baseReq.language,
        template: templateId.toString(),
        sharedId: expect.any(String),
        user: PUBLIC_USER_ID.toString(),
        published: false,
        creationDate: 1000,
        editDate: 1000,
        metadata: {},
        permissions: [{ refId: expect.any(String), type: 'user', level: 'write' }],
        obsoleteMetadata: [],
        documents: [],
        attachments: [],
        icon: { _id: null, type: 'Empty' },
      });
    });

    it('should not create entity if settings has no allowedPublicTemplates option', async () => {
      const [settingsObject] = await settingsModel.get();
      delete settingsObject.allowedPublicTemplates;
      await settingsModel.db.replaceOne({}, settingsObject);

      const response = await request(app)
        .post('/api/public')
        .field('entity', JSON.stringify(baseReq.body.entity));

      expect(response.status).toBe(403);
      expect(response.body.error).toMatch(/unauthorized public template/i);

      const res = await entities.get({ title: 'public submit' });
      expect(res.length).toBe(0);
    });

    it('should not create entity if template is not whitelisted in allowedPublicTemplates setting', async () => {
      const response = await request(app)
        .post('/api/public')
        .field(
          'entity',
          JSON.stringify({
            title: 'public submit',
            template: 'unauthorized_template_id',
          })
        );

      expect(response.status).toBe(403);
      expect(response.body.error).toMatch(/unauthorized public template/i);

      const res = await entities.get({ title: 'public submit' });
      expect(res.length).toBe(0);
    });

    it('should not allow entity updates (sending entities with _id)', async () => {
      const response = await request(app)
        .post('/api/public')
        .field(
          'entity',
          JSON.stringify({
            _id: 'an id',
            title: 'public submit',
            template: allowedPublicTemplate.toString(),
          })
        );

      expect(response.status).toBe(403);
      expect(response.body.error).toMatch(/unauthorized _id property/i);
    });

    it('should use authenticated user instead of Public user when user is logged in', async () => {
      const mongodb = getConnection();
      const writerUserFromDb = await mongodb.collection('users').findOne({ username: 'writer' });

      testingEnvironment.setPermissions(writerUserFromDb);

      const response = await request(app)
        .post('/api/public')
        .field('entity', JSON.stringify(baseReq.body.entity));

      expect(response).toHaveStatus(200);
      expect(response.body.user).toEqual(writerUserFromDb._id.toString());
      expect(response.body.user).not.toEqual(PUBLIC_USER_ID.toString());
    });
  });

  describe('/remotepublic', () => {
    let remoteApp;
    let remoteServer;

    afterEach(async () => {
      await remoteServer.close();
    });

    it('should remove the tenant and cookie from headers', done => {
      remoteApp = express();
      remoteApp.post('/api/public', (_req, res) => {
        res.json(_req.headers);
      });
      remoteServer = remoteApp.listen(54321, async () => {
        const response = await request(app)
          .post('/api/remotepublic')
          .send({ title: 'Title' })
          .set(
            'cookie',
            'locale=en; SL_G_WPT_TO=en; connect.sid=s%3AnK04AiZIYyWOjO_p.kFF17AeJhqKr207n95pV8'
          )
          .set('tenant', 'tenant')
          .expect(200);

        const headersOnRemote = JSON.parse(response.text);
        expect(headersOnRemote.tenant).toBeUndefined();
        expect(headersOnRemote.cookie).toBeUndefined();
        done();
      });
    });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });
});
