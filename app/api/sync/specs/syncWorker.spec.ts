/* eslint-disable max-statements */
import { Server } from 'http';
// eslint-disable-next-line node/no-restricted-import
import { rm, writeFile } from 'fs/promises';

import bodyParser from 'body-parser';
import 'isomorphic-fetch';
import _ from 'lodash';

import authRoutes from 'api/auth/routes';
import entities from 'api/entities';
import entitiesModel from 'api/entities/entitiesModel';
import { attachmentsPath, customUploadsPath, files, storage, testingUploadPaths } from 'api/files';
import translations from 'api/i18n';
import { permissionsContext } from 'api/permissions/permissionsContext';
import relationships from 'api/relationships';
import relationtypes from 'api/relationtypes';
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
import db, { DBFixture } from 'api/utils/testing_db';
import { advancedSort } from 'app/utils/advancedSort';
import express, { NextFunction, Request, RequestHandler, Response } from 'express';
import { DefaultTranslationsDataSource } from 'api/i18n.v2/database/data_source_defaults';
import { CreateTranslationsService } from 'api/i18n.v2/services/CreateTranslationsService';
import { ValidateTranslationsService } from 'api/i18n.v2/services/ValidateTranslationsService';
import { DefaultSettingsDataSource } from 'api/settings.v2/database/data_source_defaults';
import { FetchResponseError } from 'shared/JSONRequest';
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { syncWorker } from '../syncWorker';
import {
  host1Fixtures,
  host2Fixtures,
  hub3,
  newDoc1,
  newDoc3,
  orderedHostFixtures,
  orderedHostIds,
  relationship9,
  template1,
  template2,
  thesauri1Value2,
} from './fixtures';

async function runAllTenants() {
  try {
    await syncWorker.runAllTenants();
  } catch (e) {
    if (e instanceof FetchResponseError) {
      throw e.json;
    }
    throw e;
  }
}

async function applyFixtures(
  _host1Fixtures: DBFixture = host1Fixtures,
  _host2Fixtures = host2Fixtures
) {
  const host1db = await db.setupFixturesAndContext(_host1Fixtures, undefined, 'host1');
  const host2db = await db.setupFixturesAndContext(_host2Fixtures, undefined, 'host2');
  const target1db = await db.setupFixturesAndContext({ settings: [{}] }, undefined, 'target1');
  const target2db = await db.setupFixturesAndContext({ settings: [{}] }, undefined, 'target2');
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

  await tenants.run(async () => {
    await elasticTesting.reindex();
    await users.newUser({
      username: 'user2',
      password: 'password2',
      role: 'admin',
      email: 'user2@testing',
    });
  }, 'target2');

  return { host1db, host2db, target1db, target2db };
}

describe('syncWorker', () => {
  let server: Server;
  let server2: Server;

  beforeAll(async () => {
    const app = express();
    await db.connect({ defaultTenant: false });
    jest.spyOn(mailer, 'send').mockResolvedValue(undefined);

    tenants.add({
      name: 'host1',
      dbName: 'host1',
      indexName: 'host1',
      ...(await testingUploadPaths()),
    });

    tenants.add({
      name: 'host2',
      dbName: 'host2',
      indexName: 'host2',
      ...(await testingUploadPaths()),
    });

    tenants.add({
      name: 'target1',
      dbName: 'target1',
      indexName: 'target1',
      ...(await testingUploadPaths('syncWorker_target1_files')),
    });

    tenants.add({
      name: 'target2',
      dbName: 'target2',
      indexName: 'target2',
      ...(await testingUploadPaths('syncWorker_target2_files')),
    });

    await applyFixtures();

    app.use(bodyParser.json() as RequestHandler);
    app.use(appContextMiddleware);

    const multitenantMiddleware = (req: Request, _res: Response, next: NextFunction) => {
      if (req.get('host') === 'localhost:6667') {
        appContext.set('tenant', 'target1');
      }
      if (req.get('host') === 'localhost:6668') {
        appContext.set('tenant', 'target2');
      }
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
    server = app.listen(6667);
    server2 = app.listen(6668);
  });

  afterAll(async () => {
    await tenants.run(async () => {
      await rm(attachmentsPath(), { recursive: true });
    }, 'target1');
    await tenants.run(async () => {
      await rm(attachmentsPath(), { recursive: true });
    }, 'target2');
    await new Promise(resolve => {
      server.close(resolve);
    });
    await new Promise(resolve => {
      server2.close(resolve);
    });
    await db.disconnect();
  });

  it('should sync the configured templates and its defined properties', async () => {
    await runAllTenants();
    await tenants.run(async () => {
      const syncedTemplates = await templates.get();
      expect(syncedTemplates).toHaveLength(1);
      const [template] = syncedTemplates;
      expect(template.name).toBe('template1');
      expect(template.properties).toMatchObject([
        { name: 't1Property1' },
        { name: 't1Property2' },
        { name: 't1Thesauri1Select' },
        { name: 't1Relationship1' },
      ]);
    }, 'target1');

    await tenants.run(async () => {
      const syncedTemplates = await templates.get();
      const [syncedTemplate2, syncedTemplate3] = advancedSort(syncedTemplates, {
        property: 'name',
      });

      expect(syncedTemplate2).toMatchObject({ name: 'template2' });
      expect(syncedTemplate3).toMatchObject({ name: 'template3' });
    }, 'target2');
  });

  it('should sync entities that belong to the configured templates', async () => {
    await runAllTenants();
    await tenants.run(async () => {
      permissionsContext.setCommandContext();
      expect(await entities.get({}, {}, { sort: { title: 'asc' } })).toEqual([
        {
          _id: expect.anything(),
          sharedId: 'newDoc1SharedId',
          title: 'a new entity',
          template: template1,
          metadata: {
            t1Property1: [{ value: 'sync property 1' }],
            t1Property2: [{ value: 'sync property 2' }],
            t1Thesauri1Select: [{ value: thesauri1Value2.toString() }],
            t1Relationship1: [{ value: newDoc3.toString() }],
          },
          obsoleteMetadata: [],
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
          template: template1,
          sharedId: 'entitytest.txt',
          metadata: {
            t1Property1: [{ value: 'another doc property 1' }],
            t1Property2: [{ value: 'another doc property 2' }],
          },
          obsoleteMetadata: [],
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

    await tenants.run(async () => {
      permissionsContext.setCommandContext();
      expect(await entities.get({}, {}, { sort: { title: 'asc' } })).toEqual([
        {
          __v: 0,
          _id: expect.anything(),
          attachments: [],
          documents: [],
          metadata: {},
          obsoleteMetadata: [],
          sharedId: 'newDoc3SharedId',
          template: template2,
          title: 'New Doc 3',
        },
      ]);
    }, 'target2');
  });

  describe('sync files', () => {
    beforeAll(async () => {
      await runAllTenants();
    });

    it('should sync files belonging to the entities synced', async () => {
      await tenants.run(async () => {
        const syncedFiles = await files.get({}, '+fullText');
        expect(syncedFiles).toMatchObject([
          { entity: 'newDoc1SharedId', type: 'attachment', fullText: { 1: 'first page' } },
          { entity: 'entitytest.txt', type: 'attachment' },
          { entity: 'newDoc1SharedId', type: 'attachment' },
          { type: 'custom' },
        ]);

        expect(await storage.fileExists(syncedFiles[0].filename!, 'attachment')).toBe(true);
        expect(await storage.fileExists(syncedFiles[1].filename!, 'attachment')).toBe(true);
        expect(await storage.fileExists(syncedFiles[2].filename!, 'attachment')).toBe(true);
        expect(await storage.fileExists(syncedFiles[3].filename!, 'custom')).toBe(true);
      }, 'target1');
    });

    it('should not sync attachments if they are not whitelisted', async () => {
      await tenants.run(async () => {
        const syncedFiles = await files.get({}, '+fullText');
        expect(syncedFiles).toMatchObject([{ type: 'custom' }]);

        expect(await storage.fileExists(syncedFiles[0].filename!, 'custom')).toBe(true);
      }, 'target2');
    });
  });

  it('should sync dictionaries that match template properties whitelist', async () => {
    await runAllTenants();
    await tenants.run(async () => {
      expect(await thesauri.get()).toMatchObject([
        {
          name: 'thesauri1',
          values: [
            { _id: expect.anything(), label: 'th1value1' },
            { _id: expect.anything(), label: 'th1value2' },
          ],
        },
      ]);
    }, 'target1');
  });

  it('should sync relationTypes that match configured template properties', async () => {
    await runAllTenants();
    await tenants.run(async () => {
      expect(await relationtypes.get()).toMatchObject([
        {
          _id: expect.anything(),
          name: 'relationtype4',
        },
      ]);
    }, 'target1');
  });

  it('should syncronize translations v2 that match configured properties', async () => {
    await tenants.run(async () => {
      const transactionManager = DefaultTransactionManager();
      await new CreateTranslationsService(
        DefaultTranslationsDataSource(transactionManager),
        new ValidateTranslationsService(
          DefaultTranslationsDataSource(transactionManager),
          DefaultSettingsDataSource(transactionManager)
        ),
        transactionManager
      ).create([
        {
          language: 'en',
          key: 'System Key',
          value: 'System Value',
          context: { id: 'System', type: 'Uwazi UI', label: 'System' },
        },
        {
          language: 'en',
          key: 'template1',
          value: 'template1T',
          context: { id: template1.toString(), type: 'Entity', label: 'Entity' },
        },
        {
          language: 'en',
          key: 't1Property1L',
          value: 't1Property1T',
          context: { id: template1.toString(), type: 'Entity', label: 'Entity' },
        },
        {
          language: 'en',
          key: 't1Relationship1L',
          value: 't1Relationship1T',
          context: { id: template1.toString(), type: 'Entity', label: 'Entity' },
        },
        {
          language: 'en',
          key: 't1Relationship2L',
          value: 't1Relationship2T',
          context: { id: template1.toString(), type: 'Entity', label: 'Entity' },
        },
        {
          language: 'en',
          key: 't1Thesauri2SelectL',
          value: 't1Thesauri2SelectT',
          context: { id: template1.toString(), type: 'Entity', label: 'Entity' },
        },
        {
          language: 'en',
          key: 't1Thesauri3MultiSelectL',
          value: 't1Thesauri3MultiSelectT',
          context: { id: template1.toString(), type: 'Entity', label: 'Entity' },
        },
        {
          language: 'en',
          key: 't1Relationship1',
          value: 't1Relationship1',
          context: { id: template1.toString(), type: 'Entity', label: 'Entity' },
        },
        {
          language: 'en',
          key: 'Template Title',
          value: 'Template Title translated',
          context: { id: template1.toString(), type: 'Entity', label: 'Entity' },
        },
      ]);
    }, 'host1');

    await runAllTenants();

    await tenants.run(async () => {
      const syncedTranslations = await translations.get({});
      expect(syncedTranslations).toEqual([
        {
          contexts: [
            {
              id: 'System',
              label: 'System',
              type: 'Uwazi UI',
              values: {
                'System Key': 'System Value',
              },
            },
            {
              id: template1.toString(),
              type: 'Entity',
              label: 'Entity',
              values: {
                'Template Title': 'Template Title translated',
                t1Property1L: 't1Property1T',
                t1Relationship1L: 't1Relationship1T',
                template1: 'template1T',
              },
            },
          ],
          locale: 'en',
        },
      ]);
    }, 'target1');
  });

  it('should syncronize connections that match configured properties', async () => {
    await runAllTenants();
    await tenants.run(async () => {
      const syncedConnections = await relationships.get({});
      expect(syncedConnections).toEqual([
        {
          _id: relationship9,
          entity: 'newDoc1SharedId',
          hub: hub3,
          template: null,
        },
      ]);
    }, 'target1');
  });

  describe('when a template that is configured has been deleted', () => {
    it('should not throw an error', async () => {
      await tenants.run(async () => {
        await entitiesModel.delete({ template: template1 });
        //@ts-ignore
        await templates.delete({ _id: template1 });
      }, 'host1');

      await expect(syncWorker.runAllTenants()).resolves.not.toThrowError();
    });
  });

  describe('after changing sync configurations', () => {
    it('should delete templates not defined in the config', async () => {
      await runAllTenants();
      const changedFixtures = _.cloneDeep(host1Fixtures);
      //@ts-ignore
      changedFixtures.settings[0].sync[0].config.templates = {};
      await db.setupFixturesAndContext({ ...changedFixtures }, undefined, 'host1');

      await syncWorker.runAllTenants();

      await tenants.run(async () => {
        const syncedTemplates = await templates.get();
        expect(syncedTemplates).toHaveLength(0);
      }, 'target1');
    });
  });

  describe('when active is false', () => {
    it('should not sync anything', async () => {
      await applyFixtures();
      await runAllTenants();
      const changedFixtures = _.cloneDeep(host1Fixtures);
      //@ts-ignore
      changedFixtures.settings[0].sync[0].config.templates = {};
      //@ts-ignore
      changedFixtures.settings[0].sync[0].active = false;
      await db.setupFixturesAndContext({ ...changedFixtures }, undefined, 'host1');

      await runAllTenants();

      await tenants.run(async () => {
        const syncedTemplates = await templates.get();
        expect(syncedTemplates).toHaveLength(1);
      }, 'target1');
    }, 10000);
  });

  it('should sync collections in correct preference order', async () => {
    const originalBatchLimit = syncWorker.UPDATE_LOG_TARGET_COUNT;
    syncWorker.UPDATE_LOG_TARGET_COUNT = 1;
    const { host1db, target1db } = await applyFixtures(orderedHostFixtures, {});

    const runAndCheck = async (
      currentCollection: string,
      nextCollection: string | undefined,
      currentExpectation: any[],
      syncTimeStampExpectation: number
    ) => {
      await runAllTenants();
      const syncLog = await host1db!.collection('syncs').findOne({ name: 'target1' });

      const currentSyncedContent = await target1db!
        .collection(currentCollection)
        .find({})
        .toArray();
      expect(currentSyncedContent).toMatchObject(currentExpectation);
      expect(syncLog!.lastSyncs[currentCollection]).toBe(syncTimeStampExpectation);

      if (nextCollection) {
        const nextSyncedContent = await target1db!.collection(nextCollection).find({}).toArray();
        expect(nextSyncedContent).toEqual([]);
        expect(syncLog!.lastSyncs[nextCollection]).toBeUndefined();
      }
    };

    await runAndCheck(
      'settings',
      'translationsV2',
      [{ languages: [{ key: 'en' as 'en', default: true, label: 'en' }] }],
      1000
    );
    await runAndCheck(
      'translationsV2',
      'dictionaries',
      [{ _id: orderedHostIds.translationsV2 }],
      700
    );
    await runAndCheck('dictionaries', 'relationtypes', [{ _id: orderedHostIds.dictionaries }], 600);
    await runAndCheck('relationtypes', 'templates', [{ _id: orderedHostIds.relationtypes }], 500);
    await runAndCheck('templates', 'files', [{ _id: orderedHostIds.templates }], 40);
    await runAndCheck('files', 'connections', [{ _id: orderedHostIds.files }], 30);
    await runAndCheck(
      'connections',
      'entities',
      [{ _id: orderedHostIds.connection1 }, { _id: orderedHostIds.connection2 }],
      20
    );
    await runAndCheck(
      'entities',
      undefined,
      [{ _id: orderedHostIds.entity1 }, { _id: orderedHostIds.entity2 }],
      1
    );

    await applyFixtures();
    syncWorker.UPDATE_LOG_TARGET_COUNT = originalBatchLimit;
  });

  it('should throw an error, when trying to sync a collection that is not in the order list', async () => {
    const fixtures = _.cloneDeep(orderedHostFixtures);
    //@ts-ignore
    fixtures.settings[0].sync[0].config.pages = [];
    await applyFixtures(fixtures, {});

    await expect(runAllTenants).rejects.toThrowError(
      new Error('Invalid elements found in ordering - pages')
    );

    await applyFixtures();
  });
});
