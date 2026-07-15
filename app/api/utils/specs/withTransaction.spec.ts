/* eslint-disable max-statements */
import { ClientSession } from 'mongodb';
import { Schema } from 'mongoose';

import { Readable } from 'stream';
import entities from '#api/entities/index.js';
import { EntityFacade } from '#api/core/infrastructure/facades/EntitiesFacade.js';
import type { UpdateEntityRequest } from '#api/core/infrastructure/express/entity/Schemas.js';
import { instanceModel } from '#api/odm/model.js';
import { dbSessionContext } from '#api/odm/sessionsContext.js';
import type { LanguageISO6391, MetadataSchema } from '#shared/types/commonTypes.js';
import type { EntityWithFilesSchema } from '#shared/types/entityType.js';
import type { FileType } from '#shared/types/fileType.js';

import { storage } from '#api/files/index.js';
import { appContext } from '../AppContext.js';
import { elasticTesting } from '../elastic_testing.js';
import { getFixturesFactory } from '../fixturesFactory.js';
import { testingEnvironment } from '../testingEnvironment.js';
import { withTransaction } from '../withTransaction.js';

const factory = getFixturesFactory();

interface TestDoc {
  title: string;
  value?: number;
}

type UpdateMetadata = NonNullable<UpdateEntityRequest['metadata']>;
type UpdateMetadataValue = UpdateMetadata[string][number];

const normalizeMetadata = (metadata?: MetadataSchema): UpdateMetadata | undefined => {
  if (!metadata) {
    return undefined;
  }

  const entries = Object.entries(metadata).filter(([, values]) => Array.isArray(values));
  if (!entries.length) {
    return undefined;
  }

  return Object.fromEntries(entries) as Record<string, UpdateMetadataValue[]>;
};

const toUpdateDocuments = (entity: EntityWithFilesSchema) =>
  (entity.documents || [])
    .filter(
      (
        doc: FileType
      ): doc is FileType & { _id: NonNullable<FileType['_id']>; originalname: string } =>
        Boolean(doc?._id && doc?.originalname)
    )
    .map(doc => ({
      _id: doc._id.toString(),
      originalname: doc.originalname,
    }));

const toUpdateAttachments = (entity: EntityWithFilesSchema) =>
  (entity.attachments || [])
    .filter((attachment: FileType): attachment is FileType & { originalname: string } =>
      Boolean(attachment?.originalname)
    )
    .map(attachment => ({
      _id: attachment._id?.toString(),
      originalname: attachment.originalname,
      ...(attachment.url ? { url: attachment.url } : {}),
    }));

const toUpdatePayload = (
  current: EntityWithFilesSchema,
  title: string
): UpdateEntityRequest & { language: LanguageISO6391 } => {
  const { sharedId, language } = current;
  const id = current._id?.toString();
  if (!sharedId || !language || !id) {
    throw new Error('Missing required fields to update entity');
  }

  return {
    _id: id,
    sharedId,
    language: language as LanguageISO6391,
    title,
    template: current.template?.toString?.(),
    user: current.user?.toString?.(),
    metadata: normalizeMetadata(current.metadata),
    icon: current.icon,
    documents: toUpdateDocuments(current),
    attachments: toUpdateAttachments(current),
  };
};

afterAll(async () => {
  await testingEnvironment.tearDown();
});

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
      const transaction1 = appContext.run(async () =>
        withTransaction(async () => {
          await model.save({ title: 'concurrent1', value: 1 });
          return 'tx1';
        })
      );

      const transaction2 = appContext.run(async () =>
        withTransaction(async () => {
          await model.save({ title: 'concurrent2', value: 2 });
          return 'tx2';
        })
      );

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
      expect(dbSessionContext.getTransactionManager()).toBeUndefined();
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
  });

  describe('V2 entity mutation pattern (no withTransaction wrapper)', () => {
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

    const updateEntityTitleWithV2 = async (sharedId: string, title: string) =>
      testingEnvironment.runWithContext(async () => {
        const current = await entities.getById(sharedId, 'en');
        if (!current) {
          throw new Error(`Entity not found: ${sharedId}`);
        }

        const payload = toUpdatePayload(current as EntityWithFilesSchema, title);
        await EntityFacade.update(payload, payload.language);
      });

    it('should update entities using V2 facade without outer withTransaction', async () => {
      await appContext.run(async () => {
        await updateEntityTitleWithV2('existing1', 'update1');
        await updateEntityTitleWithV2('existing2', 'update2');

        await elasticTesting.refresh();
        const indexedEntities = await elasticTesting.getIndexedEntities();
        expect(indexedEntities).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ title: 'update1' }),
            expect.objectContaining({ title: 'update2' }),
          ])
        );
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
