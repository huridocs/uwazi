import authRoutes from 'api/auth/routes';
import entities from 'api/entities';
import {
  attachmentsPath,
  customUploadsPath,
  fileExists,
  files,
  testingUploadPaths,
} from 'api/files';
import { permissionsContext } from 'api/permissions/permissionsContext';
import syncRoutes from 'api/sync/routes';
import templates from 'api/templates';
import { tenants } from 'api/tenants';
import thesauri from 'api/thesauri';
import users from 'api/users/users';
import { appContext } from 'api/utils/AppContext';
import { appContextMiddleware } from 'api/utils/appContextMiddleware';
import { elasticTesting } from 'api/utils/elastic_testing';
import errorHandlingMiddleware from 'api/utils/error_handling_middleware';
import mailer from 'api/utils/mailer';
import db from 'api/utils/testing_db';
import bodyParser from 'body-parser';
import express, { NextFunction } from 'express';
import { rmdir, writeFile } from 'fs/promises';
import { Server } from 'http';
import 'isomorphic-fetch';
import { syncWorker } from '../syncWorker';
import {
  fixtures,
  newDoc1,
  template1,
  template1Property1,
  template1Property2,
  template1PropertyThesauri1Select,
} from './newFixtures';

describe('syncWorker', () => {
  let server: Server;
  beforeAll(async () => {
    const app = express();
    await db.connect({ defaultTenant: false });
    spyOn(mailer, 'send').and.callFake(async () => Promise.resolve());

    tenants.add({
      name: 'host1',
      dbName: 'host1',
      indexName: 'host1',
      ...(await testingUploadPaths()),
    });

    tenants.add({
      name: 'target1',
      dbName: 'target1',
      indexName: 'target1',
      ...(await testingUploadPaths('syncWorker_target_files')),
    });

    //@ts-ignore
    fixtures.settings[0].sync = [
      {
        url: 'http://localhost:6666',
        name: 'target1',
        active: true,
        username: 'user',
        password: 'password',
        config: {
          templates: {
            [template1.toString()]: [
              template1Property1.toString(),
              template1Property2.toString(),
              template1PropertyThesauri1Select.toString(),
            ],
          },
        },
      },
    ];

    await db.setupFixturesAndContext(fixtures, undefined, 'host1');
    await db.setupFixturesAndContext({ settings: [{}] }, undefined, 'target1');
    db.UserInContextMockFactory.restore();

    await tenants.run(async () => {
      await elasticTesting.reindex();
      await users.newUser({
        username: 'user',
        password: 'password',
        role: 'admin',
        email: 'user@testing',
      });
    }, 'target1');

    app.use(bodyParser.json());
    app.use(appContextMiddleware);

    const multitenantMiddleware = (_req: Request, _res: Response, next: NextFunction) => {
      appContext.set('tenant', 'target1');
      next();
    };

    //@ts-ignore
    app.use(multitenantMiddleware);

    authRoutes(app);
    syncRoutes(app);
    app.use(errorHandlingMiddleware);
    await tenants.run(async () => {
      await writeFile(attachmentsPath(`${newDoc1.toString()}.jpg`), '');
      await writeFile(attachmentsPath('test_attachment.txt'), '');
      await writeFile(attachmentsPath('test_attachment2.txt'), '');
      await writeFile(attachmentsPath('test.txt'), '');
      await writeFile(attachmentsPath('test2.txt'), '');
      await writeFile(customUploadsPath('customUpload.gif'), '');
    }, 'host1');
    server = app.listen(6666);
    await syncWorker.runAllTenants();
    await syncWorker.runAllTenants();
  });

  afterAll(async () => {
    await tenants.run(async () => {
      await rmdir(attachmentsPath(), { recursive: true });
    }, 'target1');
    await new Promise(resolve => server.close(resolve));
    await db.disconnect();
  });

  it('should sync the configured templates and only the white listed properties', async () => {
    await tenants.run(async () => {
      const syncedTemplates = await templates.get();
      expect(syncedTemplates.length).toBe(1);
      const [template] = syncedTemplates;
      expect(template.name).toBe('template1');
      expect(template.properties).toMatchObject([
        { name: 't1Property1' },
        { name: 't1Property2' },
        { name: 't1Thesauri1Select' },
      ]);
    }, 'target1');
  });

  it('should sync entities that belong to the configured templates', async () => {
    await tenants.run(async () => {
      permissionsContext.setCommandContext();
      expect(await entities.get({}, {}, { sort: { title: 'asc' } })).toEqual([
        {
          _id: expect.anything(),
          sharedId: 'newDoc1SharedId',
          title: 'a new entity',
          template: expect.anything(),
          metadata: {
            t1Property1: [{ value: 'sync property 1' }],
            t1Property2: [{ value: 'sync property 2' }],
            t1Thesauri1Select: [{ value: expect.anything() }],
          },
          __v: 0,
          documents: [],
          attachments: [
            {
              _id: expect.anything(),
              creationDate: expect.anything(),
              entity: 'newDoc1SharedId',
              filename: 'test2.txt',
              type: 'attachment',
            },
            {
              _id: expect.anything(),
              creationDate: expect.anything(),
              entity: 'newDoc1SharedId',
              filename: `${newDoc1.toString()}.jpg`,
              type: 'attachment',
            },
          ],
        },
        {
          _id: expect.anything(),
          title: 'another new entity',
          template: expect.anything(),
          sharedId: 'entitytest.txt',
          metadata: {
            t1Property1: [{ value: 'another doc property 1' }],
            t1Property2: [{ value: 'another doc property 2' }],
          },
          __v: 0,
          documents: [],
          attachments: [
            {
              _id: expect.anything(),
              creationDate: expect.anything(),
              entity: 'entitytest.txt',
              filename: 'test.txt',
              type: 'attachment',
            },
          ],
        },
      ]);
    }, 'target1');
  });

  it('should sync files belonging to the entities synced', async () => {
    await tenants.run(async () => {
      const syncedFiles = await files.get();
      expect(syncedFiles).toMatchObject([
        { entity: 'newDoc1SharedId', type: 'attachment' },
        { entity: 'entitytest.txt', type: 'attachment' },
        { entity: 'newDoc1SharedId', type: 'attachment' },
        { type: 'custom' },
      ]);

      expect(await fileExists(attachmentsPath(syncedFiles[0].filename))).toBe(true);
      expect(await fileExists(attachmentsPath(syncedFiles[1].filename))).toBe(true);
      expect(await fileExists(attachmentsPath(syncedFiles[2].filename))).toBe(true);
      expect(await fileExists(customUploadsPath(syncedFiles[3].filename))).toBe(true);
    }, 'target1');
  });

  it('should sync dictionaries that match template properties whitelist', async () => {
    await tenants.run(async () => {
      expect(await thesauri.get()).toMatchObject([
        {
          _id: expect.anything(),
          name: 'thesauri1',
          values: [
            { _id: expect.anything(), label: 'th1value1' },
            { _id: expect.anything(), label: 'th1value2' },
          ],
          __v: 0,
        },
      ]);
    }, 'target1');
  });

  // it('should sync relationTypes that match template properties whitelist', async () => {});
});
