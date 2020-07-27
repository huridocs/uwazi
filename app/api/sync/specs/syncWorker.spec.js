/* eslint-disable max-statements, max-lines */

import 'api/entities';
import 'api/thesauri/dictionariesModel';
import fs from 'fs';
import path from 'path';
import errorLog from 'api/log/errorLog';
import 'api/relationships';
import backend from 'fetch-mock';

import db from 'api/utils/testing_db';
import request from 'shared/JSONRequest';
import settings from 'api/settings';
import { settingsModel } from 'api/settings/settingsModel';
import paths from 'api/config/paths';

import fixtures, {
  settingsId,
  newDoc1,
  newDoc2,
  newDoc4,
  template1,
  template1Property1,
  template1Property2,
  template1Property3,
  template1PropertyThesauri1Select,
  template1PropertyThesauri3MultiSelect,
  template1PropertyRelationship1,
  template2,
  template2PropertyThesauri5Select,
  template2PropertyRelationship2,
  template3,
  thesauri1,
  thesauri1Value1,
  thesauri1Value2,
  thesauri3,
  thesauri4,
  thesauri5,
  relationship1,
  relationship2,
  relationship5,
  relationship7,
  relationship9,
  relationship10,
  relationship11,
  relationtype1,
  relationtype3,
  relationtype4,
  relationtype7,
  translation1,
} from './fixtures';

import syncWorker from '../syncWorker';
import syncsModel from '../syncsModel';

describe('syncWorker', () => {
  beforeEach(async () => {
    paths.uploadedDocuments = __dirname;
    spyOn(request, 'uploadFile').and.returnValue(Promise.resolve());
    spyOn(errorLog, 'error');
    syncWorker.stopped = false;
    fs.writeFileSync(path.join(__dirname, `${newDoc1.toString()}.jpg`));
    await db.clearAllAndLoad(fixtures);
  });

  afterAll(async () => {
    fs.unlinkSync(path.join(__dirname, `${newDoc1.toString()}.jpg`));
    await db.disconnect();
  });

  const syncWorkerWithConfig = async config =>
    syncWorker.syncronize({
      url: 'url',
      config,
    });

  const syncAllTemplates = async () =>
    syncWorker.syncronize({
      url: 'url',
      config: {
        templates: {
          [template1.toString()]: [],
          [template2.toString()]: [],
          [template3.toString()]: [],
        },
      },
    });

  const expectCallToEqual = (call, namespace, data) => {
    expect(call).toEqual(['url/api/sync', { namespace, data }]);
  };

  const expectCallWith = (spy, namespace, data) => {
    expect(spy).toHaveBeenCalledWith('url/api/sync', { namespace, data });
  };

  const getCallsToIds = (namespace, ids) => {
    const namespaceCallsOnly = request.post.calls
      .allArgs()
      .filter(args => args[1].namespace === namespace);
    return {
      calls: ids.map(id =>
        namespaceCallsOnly.find(c => c[1].data._id.toString() === id.toString())
      ),
      callsCount: namespaceCallsOnly.length,
    };
  };

  describe('syncronize', () => {
    beforeEach(() => {
      spyOn(request, 'post').and.returnValue(Promise.resolve());
      spyOn(request, 'delete').and.returnValue(Promise.resolve());
    });

    it('should sanitize the config to prevent deleted values to affect the process', async () => {
      const deletedTemplate = db.id();
      const deletedProperty = db.id();
      const deletedRelationtype = db.id();

      await syncWorkerWithConfig({
        templates: {
          [template1.toString()]: [template1Property1.toString(), deletedProperty.toString()],
          [deletedTemplate.toString()]: [],
          [template2.toString()]: [],
        },
        relationtypes: [relationtype1.toString(), deletedRelationtype.toString()],
      });

      const { callsCount: templateCalls } = getCallsToIds('templates', []);
      const { callsCount: relationtypesCalls } = getCallsToIds('relationtypes', []);

      expect(templateCalls).toBe(2);
      expect(relationtypesCalls).toBe(1);
    });

    it('should only sync whitelisted collections (forbidding certain collections even if present)', async () => {
      await syncWorkerWithConfig({ migrations: {}, sessions: {} });

      expect(request.post.calls.count()).toBe(0);
      expect(request.delete.calls.count()).toBe(0);
    });

    describe('settings', () => {
      it('should only include languages from settings', async () => {
        await syncWorkerWithConfig({
          templates: {},
        });

        const {
          calls: [settingsCall],
          callsCount,
        } = getCallsToIds('settings', [settingsId]);

        expect(callsCount).toBe(1);

        expectCallToEqual(settingsCall, 'settings', {
          _id: settingsId,
          languages: [{ key: 'es', default: true }],
        });
      });
    });

    describe('templates', () => {
      it('should only sync whitelisted templates and properties', async () => {
        const deletedProperty = db.id();
        await syncWorkerWithConfig({
          templates: {
            [template1.toString()]: [
              template1Property1.toString(),
              template1Property3.toString(),
              deletedProperty.toString(),
            ],
            [template2.toString()]: [],
          },
        });

        const {
          calls: [template1Call, template2Call],
          callsCount,
        } = getCallsToIds('templates', [template1, template2]);

        expect(callsCount).toBe(2);

        expectCallToEqual(
          template1Call,
          'templates',
          expect.objectContaining({
            properties: [
              expect.objectContaining({ _id: template1Property1 }),
              expect.objectContaining({ _id: template1Property3 }),
            ],
          })
        );

        expectCallToEqual(template2Call, 'templates', expect.objectContaining({ _id: template2 }));
      });
    });

    describe('thesauris (dictionaries collection)', () => {
      it('should sync whitelisted thesauris through template configs (deleting even non whitelisted ones)', async () => {
        await syncWorkerWithConfig({
          templates: {
            [template1.toString()]: [
              template1Property2.toString(),
              template1PropertyThesauri1Select.toString(),
              template1PropertyThesauri3MultiSelect.toString(),
            ],
            [template2.toString()]: [template2PropertyThesauri5Select.toString()],
          },
        });

        const {
          calls: [thesauri1Call, thesauri3Call, thesauri5Call],
          callsCount,
        } = getCallsToIds('dictionaries', [thesauri1, thesauri3, thesauri5]);

        expect(callsCount).toBe(3);

        expectCallToEqual(
          thesauri1Call,
          'dictionaries',
          expect.objectContaining({
            values: [
              expect.objectContaining({ _id: thesauri1Value1 }),
              expect.objectContaining({ _id: thesauri1Value2 }),
            ],
          })
        );

        expect(thesauri3Call).toBeDefined();
        expect(thesauri5Call).toBeDefined();
        expectCallWith(request.delete, 'dictionaries', expect.objectContaining({ _id: thesauri4 }));
      });
    });

    describe('relationtypes', () => {
      it('should sync whitelisted relationtypes and those from approved metadata properties', async () => {
        await syncWorkerWithConfig({
          templates: {
            [template1.toString()]: [template1PropertyRelationship1.toString()],
            [template2.toString()]: [template2PropertyRelationship2.toString()],
          },
          relationtypes: [relationtype1.toString(), relationtype3.toString()],
        });

        const {
          calls: [relationtype1Call, relationtype3Call, relationtype4Call, relationtype7Call],
          callsCount,
        } = getCallsToIds('relationtypes', [
          relationtype1,
          relationtype3,
          relationtype4,
          relationtype7,
        ]);

        expect(callsCount).toBe(4);
        expect(relationtype1Call).toBeDefined();
        expect(relationtype3Call).toBeDefined();
        expect(relationtype4Call).toBeDefined();
        expect(relationtype7Call).toBeDefined();
      });

      it('should allow syncing only from templates, without whitelisting a whole relationtype', async () => {
        await syncWorkerWithConfig({
          templates: { [template1.toString()]: [template1PropertyRelationship1.toString()] },
        });

        const {
          calls: [relationtype4Call],
          callsCount,
        } = getCallsToIds('relationtypes', [relationtype4]);

        expect(callsCount).toBe(1);
        expect(relationtype4Call).toBeDefined();
      });
    });

    describe('translations', () => {
      it('should include System context and exclude non-whitelisted templates, thesauris and relationtypes', async () => {
        await syncWorkerWithConfig({ templates: {} });
        const {
          calls: [translation1Call],
        } = getCallsToIds('translations', [translation1]);
        const { contexts } = translation1Call[1].data;

        expect(contexts.find(c => c.id === 'System').values).toEqual([
          { key: 'Sytem Key', value: 'System Value' },
        ]);
        expect(contexts.length).toBe(1);
      });

      it('should include from whitelisted templates and relationstypes, as well as derived thesauris and relationstypes', async () => {
        await syncWorkerWithConfig({
          templates: {
            [template1.toString()]: [
              template1PropertyRelationship1.toString(),
              template1PropertyThesauri3MultiSelect.toString(),
            ],
            [template2.toString()]: [template2PropertyRelationship2.toString()],
          },
          relationtypes: [relationtype1.toString()],
        });

        const {
          calls: [translation1Call],
        } = getCallsToIds('translations', [translation1]);
        const { contexts } = translation1Call[1].data;

        expect(contexts.find(c => c.id.toString() === template1.toString()).values).toEqual([
          { key: 'template1', value: 'template1T' },
          { key: 't1Relationship1L', value: 't1Relationship1T' },
          { key: 't1Thesauri3MultiSelectL', value: 't1Thesauri3MultiSelectT' },
        ]);
        expect(contexts.find(c => c.id.toString() === template2.toString()).values).toEqual([
          { key: 'template2', value: 'template2T' },
          { key: 't2Relationship2L', value: 't2Relationship2T' },
        ]);
        expect(contexts.find(c => c.id.toString() === relationtype1.toString()).values).toBe(
          'All values from r1'
        );
        expect(contexts.find(c => c.id.toString() === relationtype4.toString()).values).toBe(
          'All values from r4'
        );
        expect(contexts.find(c => c.id.toString() === relationtype7.toString()).values).toBe(
          'All values from r7'
        );
        expect(contexts.find(c => c.id.toString() === thesauri3.toString()).values).toBe(
          'All values from t3'
        );
        expect(contexts.length).toBe(7);
      });
    });

    describe('uploadFile', () => {
      it('should upload attachments, documents and thumbnails belonging to entities that are allowed to sync', async () => {
        await syncWorkerWithConfig({
          templates: {
            [template1.toString()]: [],
          },
        });

        expect(request.uploadFile.calls.count()).toBe(5);

        expect(request.uploadFile).toHaveBeenCalledWith(
          'url/api/sync/upload',
          'test2.txt',
          fs.readFileSync(path.join(__dirname, 'test2.txt'))
        );

        expect(request.uploadFile).toHaveBeenCalledWith(
          'url/api/sync/upload',
          'test.txt',
          fs.readFileSync(path.join(__dirname, 'test.txt'))
        );

        expect(request.uploadFile).toHaveBeenCalledWith(
          'url/api/sync/upload',
          `${newDoc1.toString()}.jpg`,
          fs.readFileSync(path.join(__dirname, `${newDoc1.toString()}.jpg`))
        );

        expect(request.uploadFile).toHaveBeenCalledWith(
          'url/api/sync/upload',
          'test_attachment.txt',
          fs.readFileSync(path.join(__dirname, 'test_attachment.txt'))
        );
        expect(request.uploadFile).toHaveBeenCalledWith(
          'url/api/sync/upload',
          'test_attachment2.txt',
          fs.readFileSync(path.join(__dirname, 'test_attachment2.txt'))
        );
      });
    });

    describe('entities', () => {
      it('should only sync entities belonging to a whitelisted template and properties and exclude non-templated entities', async () => {
        await syncWorkerWithConfig({
          templates: {
            [template1.toString()]: [
              template1Property2.toString(),
              template1Property3.toString(),
              template1PropertyThesauri1Select.toString(),
            ],
            [template2.toString()]: [],
          },
        });

        const {
          calls: [entity1Call, entity2Call],
          callsCount,
        } = getCallsToIds('entities', [newDoc1, newDoc2]);

        expect(callsCount).toBe(2);

        expectCallToEqual(
          entity1Call,
          'entities',
          expect.objectContaining({
            metadata: {
              t1Property2: [{ value: 'sync property 2' }],
              t1Property3: [{ value: 'sync property 3' }],
              t1Thesauri1Select: [{ value: thesauri1Value2 }],
            },
          })
        );

        expectCallToEqual(
          entity2Call,
          'entities',
          expect.objectContaining({
            metadata: { t1Property2: [{ value: 'another doc property 2' }] },
          })
        );

        expect(request.post).not.toHaveBeenCalledWith('url/api/sync', {
          namespace: 'entities',
          data: expect.objectContaining({ title: 'not to sync' }),
        });
      });
    });

    describe('relationships (connections collection)', () => {
      it('should sync from approved template / entities and raw whitelisted relationtypes', async () => {
        await syncWorkerWithConfig({
          templates: {
            [template1.toString()]: [],
            [template2.toString()]: [],
          },
          relationtypes: [relationtype1.toString(), relationtype3.toString()],
        });

        const {
          calls: [relationship1Call, relationship2Call],
          callsCount,
        } = getCallsToIds('connections', [relationship1, relationship2]);

        expect(callsCount).toBe(2);
        expect(relationship1Call).toBeDefined();
        expect(relationship2Call).toBeDefined();
      });

      it('should allow including null relationTypes', async () => {
        await syncWorkerWithConfig({
          templates: {
            [template1.toString()]: [],
          },
          relationtypes: [null],
        });

        const {
          calls: [relationship9Call],
          callsCount,
        } = getCallsToIds('connections', [relationship9]);

        expect(callsCount).toBe(1);
        expect(relationship9Call).toBeDefined();
      });

      it('should include from specific types inlcuded through metadata (taking null left hand-side relationships)', async () => {
        await syncWorkerWithConfig({
          templates: {
            [template1.toString()]: [template1PropertyRelationship1.toString()],
            [template2.toString()]: [template2PropertyRelationship2.toString()],
          },
        });

        const {
          calls: [
            relationsihp5Call,
            relationsihp7Call,
            relationsihp9Call,
            relationsihp10Call,
            relationsihp11Call,
          ],
          callsCount,
        } = getCallsToIds('connections', [
          relationship5,
          relationship7,
          relationship9,
          relationship10,
          relationship11,
        ]);

        expect(callsCount).toBe(5);
        expect(relationsihp5Call).toBeDefined();
        expect(relationsihp7Call).toBeDefined();
        expect(relationsihp9Call).toBeDefined();
        expect(relationsihp10Call).toBeDefined();
        expect(relationsihp11Call).toBeDefined();
      });
    });

    it('should process the log records newer than the current sync time (minus 1 sec)', async () => {
      await syncAllTemplates();

      expect(request.post.calls.count()).toBe(13);
      expect(request.delete.calls.count()).toBe(3);
    });

    it('should update lastSync timestamp with the last change', async () => {
      await syncAllTemplates();
      const [{ lastSync }] = await syncsModel.find();
      expect(lastSync).toBe(20000);
    });

    it('should update lastSync on each operation', async () => {
      request.post.and.callFake((_url, body) =>
        body.data._id.equals(relationship1)
          ? Promise.reject(new Error('post failed'))
          : Promise.resolve()
      );
      request.delete.and.callFake((_url, body) =>
        body.data._id.equals(newDoc4)
          ? Promise.reject(new Error('delete failed'))
          : Promise.resolve()
      );

      try {
        await syncAllTemplates();
      } catch (e) {
        const [{ lastSync }] = await syncsModel.find();
        expect(lastSync).toBe(12000);
      }
    });
  });

  describe('intervalSync', () => {
    it('should syncronize every x seconds', async () => {
      let syncCalls = 0;
      spyOn(syncWorker, 'syncronize').and.callFake(() => {
        if (syncCalls === 2) {
          syncWorker.stop();
        }
        syncCalls += 1;
        return Promise.resolve();
      });

      const interval = 0;
      await syncWorker.intervalSync({ url: 'url' }, interval);
      expect(syncWorker.syncronize).toHaveBeenCalledWith({ url: 'url' });
      expect(syncWorker.syncronize).toHaveBeenCalledTimes(3);
    });

    it('should retry when syncronize returns a request error', async () => {
      let syncCalls = 0;
      spyOn(syncWorker, 'syncronize').and.callFake(() => {
        if (syncCalls === 2) {
          syncWorker.stop();
        }
        syncCalls += 1;
        return Promise.reject({ status: 500, message: 'error' }); // eslint-disable-line prefer-promise-reject-errors
      });

      const interval = 0;
      await syncWorker.intervalSync({ url: 'url' }, interval);
      expect(syncWorker.syncronize).toHaveBeenCalledWith({ url: 'url' });
      expect(syncWorker.syncronize).toHaveBeenCalledTimes(3);
    });

    it('should login when a sync response its "Unauthorized"', async () => {
      spyOn(syncWorker, 'login').and.returnValue(Promise.resolve());
      let syncCalls = 0;
      spyOn(syncWorker, 'syncronize').and.callFake(() => {
        if (syncCalls === 1) {
          syncWorker.stop();
        }
        syncCalls += 1;
        return Promise.reject({ status: 401, message: 'error' }); // eslint-disable-line prefer-promise-reject-errors
      });

      const interval = 0;
      await syncWorker.intervalSync(
        { url: 'url', username: 'configUser', password: 'configPassword' },
        interval
      );
      expect(syncWorker.login).toHaveBeenCalledWith('url', 'configUser', 'configPassword');
    });
  });

  describe('login', () => {
    it('should login to the target api and set the cookie', async () => {
      backend.restore();
      backend.post('http://localhost/api/login', {
        body: '{}',
        headers: { 'set-cookie': 'cookie' },
      });
      spyOn(request, 'cookie');
      await syncWorker.login('http://localhost', 'username', 'password');
      expect(request.cookie).toHaveBeenCalledWith('cookie');
    });

    it('should catch errors and log them', async () => {
      spyOn(request, 'post').and.callFake(() => Promise.reject(new Error('post failed')));
      await syncWorker.login('http://localhost', 'username', 'password');
      expect(errorLog.error.calls.argsFor(0)[0]).toMatch('post failed');
    });
  });

  describe('start', () => {
    it('should not fail on sync not in settings', async () => {
      await settingsModel.db.update({}, { $unset: { sync: '' } });
      spyOn(syncWorker, 'intervalSync');
      const interval = 2000;

      let thrown;
      try {
        await syncWorker.start(interval);
      } catch (e) {
        thrown = e;
      }
      expect(thrown).not.toBeDefined();
    });

    it('should lazy create lastSync entry if not exists', async () => {
      await syncsModel.remove({});

      await syncWorker.start();
      const [{ lastSync }] = await syncsModel.find();
      expect(lastSync).toBe(0);
    });

    it('should get sync config and start the sync', async () => {
      spyOn(syncWorker, 'intervalSync');
      const interval = 2000;

      await syncWorker.start(interval);
      expect(syncWorker.intervalSync).toHaveBeenCalledWith(
        { url: 'url', active: true, config: {} },
        interval
      );
    });

    describe('when there is no sync config', () => {
      it('should not start the intervalSync', async () => {
        spyOn(syncWorker, 'intervalSync');
        await settings.save({ sync: {} });
        await syncWorker.start();
        expect(syncWorker.intervalSync).not.toHaveBeenCalled();
      });
    });
  });
});
