import { ClientSession } from 'mongodb';
import { Schema } from 'mongoose';

import entities from 'api/entities';
import { instanceModel } from 'api/odm/model';
import { dbSessionContext } from 'api/odm/sessionsContext';
import { EntitySchema } from 'shared/types/entityType';

import { storage } from 'api/files';
import { Readable } from 'stream';
import { appContext } from '../AppContext';
import { elasticTesting } from '../elastic_testing';
import { getFixturesFactory } from '../fixturesFactory';
import { testingEnvironment } from '../testingEnvironment';
import { withTransaction } from '../withTransaction';
import { testingTenants } from '../testingTenants';

const factory = getFixturesFactory();

interface TestDoc {
  title: string;
  value?: number;
}

afterAll(async () => {
  await testingEnvironment.tearDown();
});

const saveEntity = async (entity: EntitySchema) =>
  entities.save(entity, { user: {}, language: 'es' }, { updateRelationships: false });

const createEntity = async (entity: EntitySchema) =>
  entities.save(
    { ...entity, _id: undefined, sharedId: undefined },
    { user: {}, language: 'es' },
    { updateRelationships: false }
  );

describe('withTransaction utility', () => {
  let model: any;

  beforeAll(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const schema = new Schema({
      title: String,
      value: Number,
    });
    model = instanceModel<TestDoc>('transactiontest', schema);
  });

  beforeEach(async () => {
    await testingEnvironment.setUp({ transactiontests: [] });
    testingTenants.changeCurrentTenant({ featureFlags: { v1_transactions: true } });
    testingEnvironment.unsetFakeContext();
  });

  it('should commit transaction when operation succeeds', async () => {
    await appContext.run(async () => {
      await withTransaction(async () => {
        await model.save({ title: 'test1', value: 1 });
      });

      const docs = await model.get({ title: 'test1' });
      expect(docs[0]).toBeTruthy();
      expect(docs[0].value).toBe(1);
    });
  });

  it('should rollback transaction when operation fails', async () => {
    await appContext.run(async () => {
      let errorThrown;
      try {
        await withTransaction(async () => {
          await model.save({ title: 'test2', value: 2 });
          throw new Error('Intentional error');
        });
      } catch (error) {
        errorThrown = error;
      }

      expect(errorThrown.message).toBe('Intentional error');

      const docs = await model.get({ title: 'test2' });
      expect(docs).toHaveLength(0);
    });
  });

  it('should handle nested operations in transaction', async () => {
    await appContext.run(async () => {
      await withTransaction(async () => {
        await model.save({ title: 'doc1', value: 1 });
        await model.save({ title: 'doc2', value: 2 });
        await model.updateMany({ value: 1 }, { $set: { value: 3 } });
      });

      const docs = await model.get({}, '', { sort: { title: 1 } });
      expect(docs).toHaveLength(2);
      expect(docs[0].value).toBe(3);
      expect(docs[1].value).toBe(2);
    });
  });

  it('should properly clean up session after transaction', async () => {
    await appContext.run(async () => {
      await withTransaction(async () => {
        await model.save({ title: 'test3' });
      });

      const session = dbSessionContext.getSession();
      expect(session).toBeUndefined();
    });
  });

  it('should maintain session context during transaction', async () => {
    await appContext.run(async () => {
      await withTransaction(async () => {
        const session = dbSessionContext.getSession();
        expect(session).toBeTruthy();
        expect(session?.inTransaction()).toBe(true);

        await model.save({ title: 'test4' });
        expect(dbSessionContext.getSession()).toBe(session);
      });
    });
  });

  it('should handle concurrent transactions', async () => {
    await appContext.run(async () => {
      const transaction1 = withTransaction(async () => {
        await model.save({ title: 'concurrent1', value: 1 });
        return 'tx1';
      });

      const transaction2 = withTransaction(async () => {
        await model.save({ title: 'concurrent2', value: 2 });
        return 'tx2';
      });

      const [result1, result2] = await Promise.all([transaction1, transaction2]);
      expect(result1).toBe('tx1');
      expect(result2).toBe('tx2');

      const docs = await model.get({}, '', { sort: { title: 1 } });
      expect(docs).toHaveLength(2);
      expect(docs[0].title).toBe('concurrent1');
      expect(docs[1].title).toBe('concurrent2');
    });
  });

  it('should properly abort concurrent transactions', async () => {
    await appContext.run(async () => {
      await withTransaction(async () => {
        await model.save({ title: 'concurrent', value: 2 });
      });

      let error;
      try {
        await withTransaction(async () => {
          await model.save({ title: 'abort1', value: 1 });
          throw new Error('Abort transaction 1');
        });
      } catch (e) {
        error = e;
      }

      expect(error?.message).toBe('Abort transaction 1');

      const docs = await model.get({});
      expect(docs).toMatchObject([{ title: 'concurrent' }]);
    });
  });

  it('should do nothing when the feature flag is off when there is an error', async () => {
    testingTenants.changeCurrentTenant({ featureFlags: { v1_transactions: false } });

    await appContext.run(async () => {
      let error: Error | undefined;
      try {
        await withTransaction(async () => {
          await model.save({ title: 'test-flag-off', value: 1 });
          throw new Error('Testing error');
        });
      } catch (e) {
        error = e;
      }
      expect(error?.message).toBe('Testing error');

      const docs = await model.get({ title: 'test-flag-off' });
      expect(docs).toHaveLength(1);
    });
  });

  it('should clear the context after a transaction', async () => {
    await appContext.run(async () => {
      await withTransaction(async () => {
        await model.save({ title: 'test-clear-session' });
        dbSessionContext.registerFileOperation({
          filename: 'test',
          file: Readable.from(['content']),
          type: 'document' as const,
        });
        dbSessionContext.registerESIndexOperation([{}, 'select', 10]);
      });

      expect(dbSessionContext.getSession()).toBeUndefined();
      expect(dbSessionContext.getFileOperations()).toEqual([]);
      expect(dbSessionContext.getReindexOperations()).toEqual([]);
    });
  });

  describe('manual abort', () => {
    it('should allow manual abort without throwing error', async () => {
      await appContext.run(async () => {
        await withTransaction(async ({ abort }) => {
          await model.save({ title: 'manual-abort', value: 1 });
          await abort();
        });

        const session = dbSessionContext.getSession();
        expect(session).toBeUndefined();
        const docs = await model.get({ title: 'manual-abort' });
        expect(docs).toHaveLength(0);
      });
    });

    it('should clean up session after manual abort', async () => {
      await appContext.run(async () => {
        await withTransaction(async ({ abort }) => {
          const sessionBeforeAbort = dbSessionContext.getSession();
          expect(sessionBeforeAbort).toBeTruthy();
          expect(sessionBeforeAbort?.inTransaction()).toBe(true);

          await model.save({ title: 'session-cleanup', value: 1 });
          await abort();
        });

        expect(dbSessionContext.getSession()).toBeUndefined();
        const docs = await model.get({ title: 'session-cleanup' });
        expect(docs).toHaveLength(0);
      });
    });

    it('should abort transaction even if subsequent operations fail', async () => {
      await appContext.run(async () => {
        let error;
        try {
          await withTransaction(async ({ abort }) => {
            await model.save({ title: 'abort-then-error', value: 1 });
            await abort();
            throw new Error('Subsequent error');
          });
        } catch (e) {
          error = e;
        }

        expect(error?.message).toBe('Subsequent error');
        const docs = await model.get({ title: 'abort-then-error' });
        expect(docs).toHaveLength(0);
      });
    });

    it('should end session after abort', async () => {
      await appContext.run(async () => {
        let sessionToTest: ClientSession | undefined;
        await withTransaction(async ({ abort }) => {
          sessionToTest = dbSessionContext.getSession();
          await model.save({ title: 'session-ended', value: 1 });
          await abort();
        });

        expect(sessionToTest?.hasEnded).toBe(true);
      });
    });

    it('should do nothing when the feature flag is off', async () => {
      testingTenants.changeCurrentTenant({ featureFlags: { v1_transactions: false } });

      await appContext.run(async () => {
        await withTransaction(async ({ abort }) => {
          await model.save({ title: 'test-flag-off-abort' });
          await abort();
        });

        const docs = await model.get({ title: 'test-flag-off-abort' });
        expect(docs).toHaveLength(1);
      });
    });
  });

  describe('entities elasticsearch index', () => {
    beforeEach(async () => {
      await testingEnvironment.setUp(
        {
          transactiontests: [],
          templates: [factory.template('template1')],
          entities: [
            factory.entity('existing1', 'template1'),
            factory.entity('existing2', 'template1'),
          ],
          settings: [{ languages: [{ label: 'English', key: 'en', default: true }] }],
        },
        'with_transaction_index'
      );
      testingEnvironment.unsetFakeContext();
    });

    it('should handle delayed reindexing after a successful transaction', async () => {
      await appContext.run(async () => {
        await withTransaction(async () => {
          await entities.save(
            { ...factory.entity('test1', 'template1'), _id: undefined, sharedId: undefined },
            { user: {}, language: 'es' },
            { updateRelationships: false }
          );
          await entities.save(
            { ...factory.entity('test2', 'template1'), _id: undefined, sharedId: undefined },
            { user: {}, language: 'es' },
            { updateRelationships: false }
          );
        });

        await elasticTesting.refresh();
        const indexedEntities = await elasticTesting.getIndexedEntities();
        expect(indexedEntities).toHaveLength(4);
        expect(indexedEntities).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ title: 'test1' }),
            expect.objectContaining({ title: 'test2' }),
            expect.objectContaining({ title: 'existing1' }),
            expect.objectContaining({ title: 'existing2' }),
          ])
        );
      });
    });

    it('should not index changes to elasticsearch if transaction is aborted manually', async () => {
      await appContext.run(async () => {
        await withTransaction(async ({ abort }) => {
          await saveEntity({ ...factory.entity('existing1', 'template1'), title: 'update1' });
          await saveEntity({ ...factory.entity('existing2', 'template1'), title: 'update2' });
          await createEntity(factory.entity('new', 'template1'));
          await abort();
        });

        const indexedEntities = await elasticTesting.getIndexedEntities();
        expect(indexedEntities).toMatchObject([{ title: 'existing1' }, { title: 'existing2' }]);
      });
    });

    it('should not index changes to elasticsearch if transaction is aborted by an error', async () => {
      await appContext.run(async () => {
        let error;
        try {
          await withTransaction(async () => {
            await saveEntity({ ...factory.entity('existing1', 'template1'), title: 'update1' });
            await saveEntity({ ...factory.entity('existing2', 'template1'), title: 'update2' });
            await createEntity(factory.entity('new', 'template1'));
            throw new Error('Testing error');
          });
        } catch (e) {
          error = e;
        }

        expect(error.message).toBe('Testing error');

        const indexedEntities = await elasticTesting.getIndexedEntities();
        expect(indexedEntities).toMatchObject([{ title: 'existing1' }, { title: 'existing2' }]);
      });
    });
  });

  describe('storeFile', () => {
    afterAll(async () => {
      await storage.removeFile('file_to_commit.txt', 'document');
      await storage.removeFile('file_to_fail.txt', 'document');
      await storage.removeFile('file_to_abort.txt', 'document');
    });

    it('should store file after transaction is committed', async () => {
      await appContext.run(async () => {
        await withTransaction(async () => {
          await model.save({ title: 'test-file', value: 1 });
          await storage.storeFile('file_to_commit.txt', Readable.from(['content']), 'document');
        });

        const docs = await model.get({ title: 'test-file' });
        expect(docs[0]).toBeTruthy();
        expect(docs[0].value).toBe(1);

        expect(await storage.fileExists('file_to_commit.txt', 'document')).toBe(true);
      });
    });

    it('should rollback transaction when storeFile operation fails', async () => {
      await appContext.run(async () => {
        let errorThrown;
        jest.spyOn(storage, 'storeMultipleFiles').mockImplementation(async () => {
          throw new Error('Intentional storeFile error');
        });

        try {
          await withTransaction(async () => {
            await model.save({ title: 'test-file-fail', value: 1 });
            await storage.storeFile('file_to_fail.txt', Readable.from(['content']), 'document');
          });
        } catch (error) {
          errorThrown = error;
        }

        expect(errorThrown.message).toBe('Intentional storeFile error');

        const docs = await model.get({ title: 'test-file-fail' });
        expect(docs).toHaveLength(0);
      });
    });

    it('should rollback transaction when manually aborted after storeFile operation', async () => {
      await appContext.run(async () => {
        jest.spyOn(storage, 'storeMultipleFiles').mockImplementation(async () => {
          throw new Error('Intentional storeFile error');
        });
        await withTransaction(async ({ abort }) => {
          await model.save({ title: 'test-file-abort', value: 1 });
          await storage.storeFile('file_to_abort.txt', Readable.from(['content']), 'document');
          await abort();
        });

        const docs = await model.get({ title: 'test-file-abort' });
        expect(docs).toHaveLength(0);
      });
    });
  });
});
