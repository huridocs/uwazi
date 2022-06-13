/* eslint-disable max-statements, max-lines */

import backend from 'fetch-mock';

import 'api/thesauri/dictionariesModel';
import { model as entitesModel } from 'api/entities';
import { errorLog } from 'api/log';
import 'api/relationships';

import db from 'api/utils/testing_db';
import request from 'shared/JSONRequest';
import { attachmentsPath, customUploadsPath, fs } from 'api/files';

import { SettingsSyncSchema } from 'shared/types/settingsType';
import { ObjectIdSchema } from 'shared/types/commonTypes';
import { TranslationType } from 'shared/translationType';
import {
  fixtures,
  newDoc1,
  newDoc2,
  newDoc4,
  relationship1,
  relationship10,
  relationship11,
  relationship2,
  relationship5,
  relationship7,
  relationship9,
  relationtype1,
  relationtype3,
  relationtype4,
  relationtype7,
  settingsId,
  template1,
  template1Property1,
  template1Property2,
  template1Property3,
  template1PropertyRelationship1,
  template1PropertyThesauri1Select,
  template1PropertyThesauri3MultiSelect,
  template2,
  template2PropertyRelationship2,
  template2PropertyThesauri5Select,
  template3,
  thesauri1,
  thesauri1Value1,
  thesauri1Value2,
  thesauri3,
  thesauri4,
  thesauri5,
  translation1,
} from './fixtures';

import { syncWorker } from '../syncWorker';
import syncsModel from '../syncsModel';

describe('syncWorker', () => {
  let requestPostSpy: jasmine.Spy;
  let requestDeleteSpy: jasmine.Spy;
  let requestUploadSpy: jasmine.Spy;

  beforeEach(async () => {
    await db.clearAllAndLoad(fixtures);
    requestUploadSpy = spyOn(request, 'uploadFile').and.returnValue(Promise.resolve());
    spyOn(errorLog, 'error');
    await fs.writeFile(attachmentsPath(`${newDoc1.toString()}.jpg`), '');
    await fs.writeFile(attachmentsPath('test_attachment.txt'), '');
    await fs.writeFile(attachmentsPath('test_attachment2.txt'), '');
    await fs.writeFile(attachmentsPath('test.txt'), '');
    await fs.writeFile(attachmentsPath('test2.txt'), '');
    await fs.writeFile(customUploadsPath('customUpload.gif'), '');
  });

  afterAll(async () => {
    await db.disconnect();
    await fs.unlink(attachmentsPath(`${newDoc1.toString()}.jpg`));
    await fs.unlink(attachmentsPath('test_attachment.txt'));
    await fs.unlink(attachmentsPath('test_attachment2.txt'));
    await fs.unlink(attachmentsPath('test1.txt'));
    await fs.unlink(attachmentsPath('test2.txt'));
    await fs.unlink(customUploadsPath('customUpload.gif'));
  });

  const syncAllTemplates = async (name = 'slave1') =>
    syncWorker.syncronize({
      url: `url-${name}`,
      name,
      config: {
        templates: {
          [template1.toString()]: [],
          [template2.toString()]: [],
          [template3.toString()]: [],
        },
      },
    });

  const getCallsToIds = (namespace: string, ids: ObjectIdSchema[]) => {
    const namespaceCallsOnly = requestPostSpy.calls
      .allArgs()
      .filter(args => args[1].namespace === namespace);
    return {
      calls: ids.map(id =>
        namespaceCallsOnly.filter((c: any) => c[1].data._id.toString() === id.toString())
      ),
      callsCount: namespaceCallsOnly.length,
    };
  };

  describe('syncronize', () => {
    const expectedCookies: { [k: string]: string } = {
      'url-slave1': 'slave1 cookie',
      'url-slave3': 'slave3 cookie',
    };

    const ensureHeaders = async (url: string, _data: object, headers: { cookie: string }) => {
      const domain = url.split('/')[0];
      return headers.cookie === expectedCookies[domain]
        ? Promise.resolve()
        : Promise.reject(new Error('wrong headers'));
    };

    beforeEach(() => {
      syncWorker.cookies = { slave1: 'slave1 cookie', slave3: 'slave3 cookie' };
      requestPostSpy = spyOn(request, 'post').and.callFake(ensureHeaders);
      requestDeleteSpy = spyOn(request, 'delete').and.callFake(ensureHeaders);
    });

    it('should lazy create lastSync entries if they not already exist', async () => {
      await syncsModel.deleteMany({ name: 'slave3' });

      await syncWorker.syncronize([
        { url: 'url-slave1', name: 'slave1' },
        { url: 'url-slave3', name: 'slave3' },
      ]);

      const syncs = await syncsModel.find({}).sort({ lastSync: 1 });
      expect(syncs).toMatchObject([
        { name: 'slave3', lastSync: 0 },
        { name: 'slave1', lastSync: 8999 },
      ]);
    });

    it('should login when a sync response is "Unauthorized"', async () => {
      spyOn(syncWorker, 'login').and.returnValue(Promise.resolve());
      requestPostSpy.and.callFake(async () => {
        const responseError = { status: 401 };
        return Promise.reject(responseError);
      });

      const deletedTemplate = db.id();
      const deletedProperty = db.id();
      const deletedRelationtype = db.id();

      const syncConfig: SettingsSyncSchema = {
        url: 'url-slave1',
        name: 'slave1',
        config: {
          templates: {
            [template1.toString()]: [template1Property1.toString(), deletedProperty.toString()],
            [deletedTemplate.toString()]: [],
            [template2.toString()]: [],
          },
          relationtypes: [relationtype1.toString(), deletedRelationtype.toString()],
        },
      };
      await syncWorker.syncronize(syncConfig);
      expect(syncWorker.login).toHaveBeenCalledWith(syncConfig);
    });

    it('should allow multiple configs', async () => {
      const deletedTemplate = db.id();
      const deletedProperty = db.id();
      const deletedRelationtype = db.id();

      await syncWorker.syncronize([
        {
          url: 'url-slave1',
          name: 'slave1',
          config: {
            templates: {
              [template1.toString()]: [template1Property1.toString(), deletedProperty.toString()],
              [deletedTemplate.toString()]: [],
              [template2.toString()]: [],
            },
            relationtypes: [relationtype1.toString(), deletedRelationtype.toString()],
          },
        },
      ]);

      const { callsCount: templateCalls } = getCallsToIds('templates', []);
      const { callsCount: relationtypesCalls } = getCallsToIds('relationtypes', []);

      expect(templateCalls).toBe(2);
      expect(relationtypesCalls).toBe(1);
    });

    it('should sanitize the config to prevent deleted values to affect the process', async () => {
      const deletedTemplate = db.id();
      const deletedProperty = db.id();
      const deletedRelationtype = db.id();

      await syncWorker.syncronize({
        url: 'url-slave1',
        name: 'slave1',
        config: {
          templates: {
            [template1.toString()]: [template1Property1.toString(), deletedProperty.toString()],
            [deletedTemplate.toString()]: [],
            [template2.toString()]: [],
          },
          relationtypes: [relationtype1.toString(), deletedRelationtype.toString()],
        },
      });

      const { callsCount: templateCalls } = getCallsToIds('templates', []);
      const { callsCount: relationtypesCalls } = getCallsToIds('relationtypes', []);

      expect(templateCalls).toBe(2);
      expect(relationtypesCalls).toBe(1);
    });

    it('should only sync whitelisted collections (forbidding certain collections even if present)', async () => {
      await syncWorker.syncronize({
        url: 'url-slave1',
        name: 'slave1',
        // @ts-ignore
        config: { migrations: {}, sessions: {} },
      });

      expect(requestPostSpy.calls.count()).toBe(0);
      expect(requestDeleteSpy.calls.count()).toBe(0);
    });

    describe('settings', () => {
      it('should only include languages from settings', async () => {
        await syncWorker.syncronize({
          url: 'url-slave1',
          name: 'slave1',
          config: { templates: {} },
        });

        const {
          calls: [settingsCall],
          callsCount,
        } = getCallsToIds('settings', [settingsId]);

        expect(callsCount).toBe(1);

        expect(settingsCall).toEqual([
          [
            `url-${'slave1'}/api/sync`,
            {
              namespace: 'settings',
              data: {
                _id: settingsId,
                languages: [{ key: 'es', default: true, label: 'es' }],
              },
            },
            { cookie: `${'slave1'} cookie` },
          ],
        ]);
      });
    });

    describe('templates', () => {
      it('should only sync whitelisted templates and properties', async () => {
        const deletedProperty = db.id();
        await syncWorker.syncronize({
          url: 'url-slave1',
          name: 'slave1',
          config: {
            templates: {
              [template1.toString()]: [
                template1Property1.toString(),
                template1Property3.toString(),
                deletedProperty.toString(),
              ],
              [template2.toString()]: [],
            },
          },
        });

        const {
          calls: [template1Call, template2Call],
          callsCount,
        } = getCallsToIds('templates', [template1, template2]);

        expect(callsCount).toBe(2);

        expect(template1Call).toEqual([
          [
            `url-${'slave1'}/api/sync`,
            {
              namespace: 'templates',
              data: expect.objectContaining({
                properties: [
                  expect.objectContaining({ _id: template1Property1 }),
                  expect.objectContaining({ _id: template1Property3 }),
                ],
              }),
            },
            { cookie: `${'slave1'} cookie` },
          ],
        ]);

        expect(template2Call).toEqual([
          [
            `url-${'slave1'}/api/sync`,
            {
              namespace: 'templates',
              data: expect.objectContaining({ _id: template2 }),
            },
            { cookie: `${'slave1'} cookie` },
          ],
        ]);
      });

      it('should not sync the entity view page foreign key', async () => {
        await syncWorker.syncronize({
          url: 'url-slave1',
          name: 'slave1',
          config: {
            templates: {
              [template1.toString()]: [
                template1Property1.toString(),
                template1Property3.toString(),
              ],
            },
          },
        });

        const {
          calls: [templateCall],
          callsCount,
        } = getCallsToIds('templates', [template1]);

        expect(callsCount).toBe(1);

        expect(templateCall[0][1].data.entityViewPage).toBeUndefined();
      });

      it('should mark the template as synced', async () => {
        await syncWorker.syncronize({
          url: 'url-slave1',
          name: 'slave1',
          config: {
            templates: {
              [template1.toString()]: [
                template1Property1.toString(),
                template1Property3.toString(),
              ],
            },
          },
        });

        const {
          calls: [templateCall],
          callsCount,
        } = getCallsToIds('templates', [template1]);

        expect(callsCount).toBe(1);

        expect(templateCall[0][1].data.synced).toBe(true);
      });
    });

    describe('thesauris (dictionaries collection)', () => {
      it('should sync whitelisted thesauris through template configs (deleting non-whitelisted ones)', async () => {
        await syncWorker.syncronize({
          url: 'url-slave1',
          name: 'slave1',
          config: {
            templates: {
              [template1.toString()]: [
                template1Property2.toString(),
                template1PropertyThesauri1Select.toString(),
                template1PropertyThesauri3MultiSelect.toString(),
              ],
              [template2.toString()]: [template2PropertyThesauri5Select.toString()],
            },
          },
        });

        const {
          calls: [thesauri1Call, thesauri3Call, thesauri5Call],
          callsCount,
        } = getCallsToIds('dictionaries', [thesauri1, thesauri3, thesauri5]);

        expect(callsCount).toBe(3);

        expect(thesauri1Call).toMatchObject([
          [
            `url-${'slave1'}/api/sync`,
            {
              namespace: 'dictionaries',
              data: {
                values: [{ _id: thesauri1Value1 }, { _id: thesauri1Value2 }],
              },
            },
            { cookie: `${'slave1'} cookie` },
          ],
        ]);

        expect(thesauri3Call).toBeDefined();
        expect(thesauri5Call).toBeDefined();
        expect(requestDeleteSpy).toHaveBeenCalledWith(
          `url-${'slave1'}/api/sync`,
          { namespace: 'dictionaries', data: expect.objectContaining({ _id: thesauri4 }) },
          { cookie: `${'slave1'} cookie` }
        );
      });
    });

    describe('relationtypes', () => {
      it('should sync whitelisted relationtypes and those from approved metadata properties', async () => {
        await syncWorker.syncronize({
          url: 'url-slave1',
          name: 'slave1',
          config: {
            templates: {
              [template1.toString()]: [template1PropertyRelationship1.toString()],
              [template2.toString()]: [template2PropertyRelationship2.toString()],
            },
            relationtypes: [relationtype1.toString(), relationtype3.toString()],
          },
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
        await syncWorker.syncronize({
          url: 'url-slave1',
          name: 'slave1',
          config: {
            templates: { [template1.toString()]: [template1PropertyRelationship1.toString()] },
          },
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
        await syncWorker.syncronize({
          url: 'url-slave1',
          name: 'slave1',
          config: { templates: {} },
        });
        const {
          calls: [translation1Call],
        } = getCallsToIds('translations', [translation1]);
        const { contexts } = translation1Call[0][1].data;

        expect(contexts.find((c: any) => c.id === 'System').values).toEqual([
          { key: 'Sytem Key', value: 'System Value' },
        ]);
        expect(contexts.length).toBe(1);
      });

      it('should include from whitelisted templates and relationstypes, as well as derived thesauris and relationstypes', async () => {
        await syncWorker.syncronize({
          url: 'url-slave1',
          name: 'slave1',
          config: {
            templates: {
              [template1.toString()]: [
                template1PropertyRelationship1.toString(),
                template1PropertyThesauri3MultiSelect.toString(),
              ],
              [template2.toString()]: [template2PropertyRelationship2.toString()],
            },
            relationtypes: [relationtype1.toString()],
          },
        });

        const {
          calls: [translation1Call],
        } = getCallsToIds('translations', [translation1]);
        const { contexts }: { contexts: TranslationType['contexts'] } = translation1Call[0][1].data;

        expect(contexts?.find(c => c.id?.toString() === template1.toString())?.values).toEqual([
          { key: 'template1', value: 'template1T' },
          { key: 't1Relationship1L', value: 't1Relationship1T' },
          { key: 't1Thesauri3MultiSelectL', value: 't1Thesauri3MultiSelectT' },
          { key: 'Template Title', value: 'Template Title translated' },
        ]);
        expect(contexts?.find(c => c.id?.toString() === template2.toString())?.values).toEqual([
          { key: 'template2', value: 'template2T' },
          { key: 't2Relationship2L', value: 't2Relationship2T' },
        ]);
        expect(contexts?.find(c => c.id?.toString() === relationtype1.toString())?.values).toBe(
          'All values from r1'
        );
        expect(contexts?.find(c => c.id?.toString() === relationtype4.toString())?.values).toBe(
          'All values from r4'
        );
        expect(contexts?.find(c => c.id?.toString() === relationtype7.toString())?.values).toBe(
          'All values from r7'
        );
        expect(contexts?.find(c => c.id?.toString() === thesauri3.toString())?.values).toBe(
          'All values from t3'
        );
        expect(contexts?.length).toBe(7);
      });
    });

    const expectUploadFile = async (
      path: string,
      filename: string,
      pathFunction = attachmentsPath,
      name = 'slave1'
    ) => {
      expect(requestUploadSpy).toHaveBeenCalledWith(
        `url-${name}${path}`,
        filename,
        await fs.readFile(pathFunction(filename)),
        `${name} cookie`
      );
    };

    describe('uploadFile', () => {
      it('should upload attachments, documents and thumbnails belonging to entities that are of an allowed template, and customs', async () => {
        await syncWorker.syncronize({
          url: 'url-slave1',
          name: 'slave1',
          config: {
            templates: {
              [template1.toString()]: [],
            },
          },
        });

        expect(requestUploadSpy.calls.count()).toBe(6);

        await expectUploadFile('/api/sync/upload', 'test2.txt');
        await expectUploadFile('/api/sync/upload', 'test.txt');
        await expectUploadFile('/api/sync/upload', `${newDoc1.toString()}.jpg`);
        await expectUploadFile('/api/sync/upload', 'test_attachment.txt');
        await expectUploadFile('/api/sync/upload', 'test_attachment2.txt');
        await expectUploadFile('/api/sync/upload/custom', 'customUpload.gif', customUploadsPath);
      });

      it('should upload files belonging to entities that are not filtered out, and customs', async () => {
        await syncWorker.syncronize({
          url: 'url-slave1',
          name: 'slave1',
          config: {
            templates: {
              [template1.toString()]: {
                properties: [],
                filter: JSON.stringify({
                  'metadata.t1Property1': { $elemMatch: { value: 'sync property 1' } },
                }),
              },
            },
          },
        });

        expect(requestUploadSpy.calls.count()).toBe(5);

        await expectUploadFile('/api/sync/upload', 'test2.txt');
        await expectUploadFile('/api/sync/upload', `${newDoc1.toString()}.jpg`);
        await expectUploadFile('/api/sync/upload', 'test_attachment.txt');
        await expectUploadFile('/api/sync/upload', 'test_attachment2.txt');
        await expectUploadFile('/api/sync/upload/custom', 'customUpload.gif', customUploadsPath);
      });
    });

    describe('entities', () => {
      let baseConfig: SettingsSyncSchema;

      beforeEach(() => {
        baseConfig = {
          url: 'url-slave1',
          name: 'slave1',
          config: {
            templates: {
              [template1.toString()]: [
                template1Property2.toString(),
                template1Property3.toString(),
                template1PropertyThesauri1Select.toString(),
              ],
              [template2.toString()]: [],
            },
          },
        };
      });

      it('should only sync entities belonging to a whitelisted template and properties and exclude non-templated entities', async () => {
        await syncWorker.syncronize(baseConfig);

        const {
          calls: [entity1Call, entity2Call],
          callsCount,
        } = getCallsToIds('entities', [newDoc1, newDoc2]);

        expect(callsCount).toBe(2);

        expect(entity1Call).toMatchObject([
          [
            `url-${'slave1'}/api/sync`,
            {
              namespace: 'entities',
              data: {
                metadata: {
                  t1Property2: [{ value: 'sync property 2' }],
                  t1Property3: [{ value: 'sync property 3' }],
                  t1Thesauri1Select: [{ value: thesauri1Value2.toString() }],
                },
              },
            },
            { cookie: `${'slave1'} cookie` },
          ],
        ]);

        expect(entity2Call).toMatchObject([
          [
            `url-${'slave1'}/api/sync`,
            {
              namespace: 'entities',
              data: {
                metadata: { t1Property2: [{ value: 'another doc property 2' }] },
              },
            },
            { cookie: `${'slave1'} cookie` },
          ],
        ]);

        expect(request.post).not.toHaveBeenCalledWith('url/api/sync', {
          namespace: 'entities',
          data: expect.objectContaining({ title: 'not to sync' }),
        });
      });

      describe('Filtering', () => {
        let filterConfig: SettingsSyncSchema;

        beforeEach(() => {
          filterConfig = { ...baseConfig };
          filterConfig.config = {
            templates: {
              ...baseConfig.config?.templates,
              [template1.toString()]: {
                properties: [
                  template1Property2.toString(),
                  template1Property3.toString(),
                  template1PropertyThesauri1Select.toString(),
                ],
                filter:
                  '{ "metadata.t1Property2": { "$elemMatch": { "value": "another doc property 2" } } }',
              },
            },
          };
        });

        it('should allow filtering entities based on filter function', async () => {
          await syncWorker.syncronize(filterConfig);

          const {
            callsCount,
            calls: [entity2Call],
          } = getCallsToIds('entities', [newDoc2]);
          expect(callsCount).toBe(1);
          expect(entity2Call).toBeDefined();
        });

        it('should fail on error', async () => {
          // @ts-ignore
          filterConfig.config.templates[template1.toString()].filter = 'return missing;';
          try {
            await syncWorker.syncronize(filterConfig);
            fail('should not pass');
          } catch (err) {
            expect(err.message).toContain('JSON');
          }
        });

        describe('When entity no longer passes filter', () => {
          it('should delete target entities', async () => {
            const nonMatchingEntity = {
              title: 'another matching entity',
              template: template1.toString(),
              sharedId: 'entitytest.txt',
              metadata: {
                t1Property2: [{ value: 'will not pass filter' }],
              },
            };

            const [savedEntity] = await entitesModel.saveMultiple([nonMatchingEntity]);

            await syncWorker.syncronize(filterConfig);

            expect(requestDeleteSpy).toHaveBeenCalledWith(
              `url-${'slave1'}/api/sync`,
              { namespace: 'entities', data: expect.objectContaining({ _id: savedEntity._id }) },
              { cookie: `${'slave1'} cookie` }
            );
          });
        });
      });
    });

    describe('relationships (connections collection)', () => {
      it('should sync from approved template / entities and raw whitelisted relationtypes', async () => {
        await syncWorker.syncronize({
          url: 'url-slave1',
          name: 'slave1',
          config: {
            templates: {
              [template1.toString()]: [],
              [template2.toString()]: [],
            },
            relationtypes: [relationtype1.toString(), relationtype3.toString()],
          },
        });

        const {
          calls: [relationship1Call, relationship2Call],
          callsCount,
        } = getCallsToIds('connections', [relationship1, relationship2]);

        expect(callsCount).toBe(2);
        expect(relationship1Call).toBeDefined();
        expect(relationship2Call).toBeDefined();
      });

      it('should allow including null relationtypes', async () => {
        await syncWorker.syncronize({
          url: 'url-slave1',
          name: 'slave1',
          config: {
            templates: {
              [template1.toString()]: [],
            },
            // @ts-ignore
            relationtypes: [null],
          },
        });

        const {
          calls: [relationship9Call],
          callsCount,
        } = getCallsToIds('connections', [relationship9]);

        expect(callsCount).toBe(1);
        expect(relationship9Call).toBeDefined();
      });

      it('should include from specific types inlcuded through metadata (taking null left hand-side relationships)', async () => {
        await syncWorker.syncronize({
          url: 'url-slave1',
          name: 'slave1',
          config: {
            templates: {
              [template1.toString()]: [template1PropertyRelationship1.toString()],
              [template2.toString()]: [template2PropertyRelationship2.toString()],
            },
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

    it('should process the log records newer than the last synced entity', async () => {
      await syncAllTemplates();

      expect(requestPostSpy.calls.count()).toBe(14);
      expect(requestDeleteSpy.calls.count()).toBe(27);

      requestPostSpy.calls.reset();
      requestDeleteSpy.calls.reset();

      await syncAllTemplates();
      expect(requestPostSpy.calls.count()).toBe(0);
      expect(requestDeleteSpy.calls.count()).toBe(0);
    });

    it('should update lastSync timestamp with the last change', async () => {
      await syncAllTemplates();
      let [{ lastSync: lastSync1 }] = await syncsModel.find({ name: 'slave1' });
      let [{ lastSync: lastSync3 }] = await syncsModel.find({ name: 'slave3' });
      expect(lastSync1).toBe(22000);
      expect(lastSync3).toBe(1000);
      requestPostSpy.calls.reset();

      await syncsModel._updateMany({ name: 'slave3' }, { $set: { lastSync: 8999 } }, {});
      await syncAllTemplates('slave3');
      [{ lastSync: lastSync1 }] = await syncsModel.find({ name: 'slave1' });
      [{ lastSync: lastSync3 }] = await syncsModel.find({ name: 'slave3' });
      expect(lastSync1).toBe(22000);
      expect(lastSync3).toBe(22000);
      expect(requestPostSpy).toHaveBeenCalledWith(
        `url-${'slave3'}/api/sync`,
        { namespace: 'entities', data: expect.objectContaining({ _id: newDoc2 }) },
        { cookie: `${'slave3'} cookie` }
      );
    });

    it('should update lastSync on each operation', async () => {
      requestPostSpy.and.callFake(async (_url, body) =>
        body.data._id.equals(relationship1)
          ? Promise.reject(new Error('post failed'))
          : Promise.resolve()
      );
      requestDeleteSpy.and.callFake(async (_url, body) =>
        body.data._id.equals(newDoc4)
          ? Promise.reject(new Error('delete failed'))
          : Promise.resolve()
      );

      try {
        await syncAllTemplates();
      } catch (e) {
        const [{ lastSync }] = await syncsModel.find({});
        expect(lastSync).toBe(12000);
      }
    });
  });

  describe('login', () => {
    const username = 'username';
    const password = 'password';

    const mockLoginPost = (url: string, cookie: string) => {
      backend.post(url, (_url, opts) => {
        if (opts.body === JSON.stringify({ username, password })) {
          return {
            body: '{}',
            headers: { 'set-cookie': cookie },
          };
        }

        throw new Error('Username and Password passed incorrectly');
      });
    };

    it('should login to the target api and store the login credentials for that service', async () => {
      backend.restore();

      mockLoginPost('http://localhost/api/login', 'cookie1');
      mockLoginPost('http://anotherhost/api/login', 'cookie2');

      await syncWorker.login({ url: 'http://localhost', name: 'service1', username, password });
      await syncWorker.login({ url: 'http://anotherhost', name: 'service2', username, password });

      expect(errorLog.error).not.toHaveBeenCalled();
      expect(syncWorker.cookies.service1).toBe('cookie1');
      expect(syncWorker.cookies.service2).toBe('cookie2');
    });
  });
});
