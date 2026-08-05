import { tenants } from '#api/tenants/tenantContext.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { PostgresTransactionManager } from '#api/core/infrastructure/postgresql/common/PostgresTransactionManager.js';
import { PostgresFilesSyncHandler } from '../PostgresFilesSyncHandler.js';

const factory = getFixturesFactory({ convertIdToString: true });

const createHandler = () => {
  const tenantName = tenants.current().name;
  return new PostgresFilesSyncHandler({
    tenantId: tenantName,
    pgTransactionManager: new PostgresTransactionManager(
      PostgresDB.knex,
      tenantName,
      LoggerFactory.forTests()
    ),
  });
};

describe('PostgresFilesSyncHandler', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  beforeEach(async () => {
    await testingPG.clear(['files']);
  });

  describe('getById', () => {
    it('returns the file row when found', async () => {
      const handler = createHandler();
      const file = factory.document('test-doc', { entity: 'e1', status: 'ready' });

      await handler.save(file as any);

      const found = await handler.getById(file._id as string);
      expect(found).not.toBeNull();
      expect(found).toMatchObject({
        filename: 'test-doc',
        type: 'document',
        entity: 'e1',
        status: 'ready',
      });
    });

    it('returns null when the file does not exist', async () => {
      const handler = createHandler();
      const result = await handler.getById('nonexistent-id');
      expect(result).toBeNull();
    });
  });

  describe('save', () => {
    it('inserts a new file row', async () => {
      const handler = createHandler();
      const file = factory.document('new-doc', { entity: 'e1', status: 'ready' });

      await handler.save(file as any);

      const rows = await testingPG.getAllFrom('files');
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        filename: 'new-doc',
        type: 'document',
        entity: 'e1',
      });
    });

    it('updates an existing row on save with same id', async () => {
      const handler = createHandler();
      const file = factory.document('updatable', {
        entity: 'e1',
        status: 'ready',
        originalname: 'initial',
      });

      await handler.save(file as any);

      await handler.save({
        _id: file._id.toString(),
        originalname: 'updated',
        filename: 'updatable',
        mimetype: 'application/pdf',
        size: 2048,
        creationDate: 2000,
        type: 'document',
      });

      const found = await handler.getById(file._id as string);
      expect(found?.originalname).toBe('updated');
      expect(found?.size).toBe(2048);
    });

    it('throws when _id is missing', async () => {
      const handler = createHandler();
      await expect(
        handler.save({
          filename: 'no-id',
          type: 'document',
        } as any)
      ).rejects.toThrow('PostgresFilesSyncHandler: document._id is required');
    });

    it('round-trips JSONB columns correctly', async () => {
      const handler = createHandler();
      const file = factory.document('jsonb-test', {
        entity: 'e_jsonb',
        status: 'ready',
        toc: [{ label: 'Chapter 1', indentation: 0 }],
        propertySelections: [{ propertyID: 'p1', name: 'selected' }],
        fullText: { 1: 'page one', 2: 'page two' },
      });

      await handler.save(file as any);

      const found = await handler.getById(file._id as string);
      expect(found).not.toBeNull();
      expect(found!.toc).toEqual([{ label: 'Chapter 1', indentation: 0 }]);
      expect(found!.propertySelections).toEqual([{ propertyID: 'p1', name: 'selected' }]);
      expect(found!.fullText).toEqual({ 1: 'page one', 2: 'page two' });
    });

    it('should strip legacy MongoDB-only fields before upserting into Postgres', async () => {
      const handler = createHandler();
      const file = factory.document('test-doc', { entity: 'e1', status: 'ready' });

      const dataWithExtras = {
        ...file,
        __v: 0,
        uploaded: true,
        iso639_3: 'eng',
      };

      await expect(handler.save(dataWithExtras as any)).resolves.not.toThrow();

      const saved = await handler.getById(file._id as string);
      expect(saved).not.toBeNull();
      expect((saved as any).__v).toBeUndefined();
      expect((saved as any).uploaded).toBeUndefined();
      expect((saved as any).iso639_3).toBeUndefined();
    });
  });

  describe('saveMultiple', () => {
    it('inserts multiple file rows', async () => {
      const handler = createHandler();
      const file1 = factory.document('multi-1', { entity: 'e1', status: 'ready' });
      const file2 = factory.document('multi-2', { entity: 'e2', status: 'ready' });

      await handler.saveMultiple([file1 as any, file2]);

      const rows = await testingPG.getAllFrom('files');
      expect(rows).toHaveLength(2);
    });

    it('returns empty array when documents list is empty', async () => {
      const handler = createHandler();
      const result = await handler.saveMultiple([]);
      expect(result).toEqual([]);
    });

    it('throws when any document is missing _id', async () => {
      const handler = createHandler();
      const file1 = factory.document('valid', { entity: 'e1', status: 'ready' });

      await expect(
        handler.saveMultiple([file1, { filename: 'no-id', type: 'document' } as any])
      ).rejects.toThrow('PostgresFilesSyncHandler: document._id is required');
    });

    it('persists all rows and returns them', async () => {
      const handler = createHandler();
      const file1 = factory.document('multi-a', { entity: 'e_a', status: 'ready' });
      const file2 = factory.document('multi-b', { entity: 'e_b', status: 'ready' });

      const saved = await handler.saveMultiple([file1 as any, file2]);

      expect(saved).toHaveLength(2);
      expect(saved.map(r => r.filename)).toEqual(expect.arrayContaining(['multi-a', 'multi-b']));
    });

    it('should strip legacy MongoDB-only fields when saving multiple documents', async () => {
      const handler = createHandler();
      const file1 = factory.document('multi-extra-1', { entity: 'e1', status: 'ready' });
      const file2 = factory.document('multi-extra-2', { entity: 'e1', status: 'ready' });

      const docs = [
        { ...file1, __v: 0, uploaded: true },
        { ...file2, __v: 0, iso639_3: 'eng' },
      ];

      await expect(handler.saveMultiple(docs as any)).resolves.not.toThrow();

      const rows = await testingPG.getAllFrom('files');
      expect(rows).toHaveLength(2);

      for (const row of rows) {
        expect((row as any).__v).toBeUndefined();
        expect((row as any).uploaded).toBeUndefined();
        expect((row as any).iso639_3).toBeUndefined();
      }
    });
  });

  describe('delete', () => {
    it('removes a file row', async () => {
      const handler = createHandler();
      const file = factory.document('to-delete', { entity: 'e1', status: 'ready' });

      await handler.save(file as any);
      await handler.delete(file._id as string);

      const found = await handler.getById(file._id as string);
      expect(found).toBeNull();
    });

    it('does not throw when deleting a non-existent id', async () => {
      const handler = createHandler();
      await expect(handler.delete('nonexistent-id')).resolves.not.toThrow();
    });
  });

  describe('sync log pollution', () => {
    it('should not write sync log entries when saving', async () => {
      const logCollection = getConnection().collection('updatelogs');
      await logCollection.deleteMany({ namespace: 'files' });

      const handler = createHandler();
      const file = factory.document('no-sync-log', { entity: 'e1', status: 'ready' });

      await handler.save(file as any);

      const logs = await logCollection.countDocuments({ namespace: 'files' });
      expect(logs).toBe(0);
    });

    it('should not write sync log entries when saving multiple', async () => {
      const logCollection = getConnection().collection('updatelogs');
      await logCollection.deleteMany({ namespace: 'files' });

      const handler = createHandler();
      const file1 = factory.document('no-sync-log-1', { entity: 'e1', status: 'ready' });
      const file2 = factory.document('no-sync-log-2', { entity: 'e2', status: 'ready' });

      await handler.saveMultiple([file1 as any, file2 as any]);

      const logs = await logCollection.countDocuments({ namespace: 'files' });
      expect(logs).toBe(0);
    });

    it('should not write sync log entries when deleting', async () => {
      const logCollection = getConnection().collection('updatelogs');
      await logCollection.deleteMany({ namespace: 'files' });

      const handler = createHandler();
      const file = factory.document('no-sync-log-del', { entity: 'e1', status: 'ready' });
      await handler.save(file as any);

      await logCollection.deleteMany({ namespace: 'files' });

      await handler.delete(file._id as string);

      const logs = await logCollection.countDocuments({ namespace: 'files' });
      expect(logs).toBe(0);
    });
  });
});
