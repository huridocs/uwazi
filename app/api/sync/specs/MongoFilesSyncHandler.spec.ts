/* eslint-disable max-statements */
import { ObjectId } from 'mongodb';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { MongoFilesSyncHandler } from '#api/sync/MongoFilesSyncHandler.js';

const createHandler = () => new MongoFilesSyncHandler();

const baseFile = (overrides: Record<string, unknown> = {}) => ({
  _id: new ObjectId(),
  originalname: 'test.pdf',
  filename: 'test.pdf',
  mimetype: 'application/pdf',
  size: 1024,
  creationDate: Date.now(),
  ...overrides,
});

describe('MongoFilesSyncHandler', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp({
      files: [],
    });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('getById', () => {
    it('returns the file row when found', async () => {
      const file = baseFile({ type: 'custom' });
      await testingEnvironment.setUp({ files: [file] });

      const handler = createHandler();
      const result = await handler.getById(file._id.toHexString());

      expect(result?._id).toEqual(file._id);
      expect(result?.originalname).toBe('test.pdf');
    });

    it('returns null when the file does not exist', async () => {
      const handler = createHandler();
      const result = await handler.getById(new ObjectId().toHexString());

      expect(result).toBeNull();
    });
  });

  describe('save', () => {
    it('inserts a new file row', async () => {
      const id = new ObjectId();
      const handler = createHandler();

      const saved = await handler.save({
        _id: id.toHexString(),
        originalname: 'new.pdf',
        filename: 'new.pdf',
        mimetype: 'application/pdf',
        size: 512,
        creationDate: Date.now(),
        type: 'custom',
      } as any);

      expect(saved._id).toEqual(id);
      expect(saved.originalname).toBe('new.pdf');

      const stored = await testingEnvironment.db.getAllFrom('files');
      expect(stored).toHaveLength(1);
      expect(stored[0]._id).toEqual(id);
      expect(stored[0].originalname).toBe('new.pdf');
    });

    it('updates an existing row on save with same id', async () => {
      const id = new ObjectId();
      await testingEnvironment.setUp({
        files: [
          {
            _id: id,
            originalname: 'original.pdf',
            filename: 'original.pdf',
            mimetype: 'application/pdf',
            size: 100,
            creationDate: Date.now(),
            type: 'custom',
          },
        ],
      });

      const handler = createHandler();
      const saved = await handler.save({
        _id: id.toHexString(),
        originalname: 'updated.pdf',
        filename: 'updated.pdf',
        mimetype: 'application/pdf',
        size: 200,
        creationDate: Date.now(),
        type: 'custom',
      } as any);

      expect(saved.originalname).toBe('updated.pdf');
      expect(saved.size).toBe(200);

      const stored = await testingEnvironment.db.getAllFrom('files');
      expect(stored).toHaveLength(1);
      expect(stored[0].originalname).toBe('updated.pdf');
    });

    it('round-trips document fields (toc, propertySelections, fullText)', async () => {
      const id = new ObjectId();
      const handler = createHandler();

      const saved = await handler.save({
        _id: id.toHexString(),
        originalname: 'doc.pdf',
        filename: 'doc.pdf',
        mimetype: 'application/pdf',
        size: 2048,
        creationDate: Date.now(),
        type: 'document',
        entity: 'e1',
        status: 'ready',
        totalPages: 3,
        language: 'eng',
        generatedToc: true,
        toc: [{ label: 'Chapter 1', indentation: 0 }],
        propertySelections: [{ propertyID: 'p1', name: 'selected' }],
        fullText: { 1: 'page one', 2: 'page two' },
      } as any);

      expect(saved._id).toEqual(id);
      expect(saved.toc).toEqual([{ label: 'Chapter 1', indentation: 0 }]);
      expect(saved.propertySelections).toEqual([{ propertyID: 'p1', name: 'selected' }]);
      expect(saved.fullText).toEqual({ 1: 'page one', 2: 'page two' });

      const stored = await testingEnvironment.db.getAllFrom('files');
      expect(stored).toHaveLength(1);
      expect(stored[0].toc).toEqual([{ label: 'Chapter 1', indentation: 0 }]);
      expect(stored[0].propertySelections).toEqual([{ propertyID: 'p1', name: 'selected' }]);
      expect(stored[0].fullText).toEqual({ 1: 'page one', 2: 'page two' });
    });

    it('throws when _id is missing', async () => {
      const handler = createHandler();

      await expect(handler.save({ originalname: 'no-id.pdf' } as any)).rejects.toThrow(
        'MongoFilesSyncHandler: document._id is required'
      );
    });

    it('should strip tenant_id from incoming data when saving', async () => {
      const handler = createHandler();
      const id = new ObjectId();

      const dataWithTenantId = {
        _id: id.toHexString(),
        originalname: 'test.pdf',
        filename: 'test.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        creationDate: Date.now(),
        type: 'custom',
        tenant_id: 'some-other-tenant',
      };

      await handler.save(dataWithTenantId as any);

      const saved = await handler.getById(id.toHexString());
      expect(saved).not.toBeNull();
      expect((saved as any).tenant_id).toBeUndefined();
    });
  });

  describe('saveMultiple', () => {
    it('inserts multiple file rows', async () => {
      const handler = createHandler();
      const id1 = new ObjectId().toHexString();
      const id2 = new ObjectId().toHexString();

      await handler.saveMultiple([
        {
          _id: id1,
          originalname: 'file1.pdf',
          filename: 'file1.pdf',
          mimetype: 'application/pdf',
          size: 100,
          creationDate: Date.now(),
          type: 'custom',
        } as any,
        {
          _id: id2,
          originalname: 'file2.pdf',
          filename: 'file2.pdf',
          mimetype: 'application/pdf',
          size: 200,
          creationDate: Date.now(),
          type: 'custom',
        } as any,
      ]);

      const stored = await testingEnvironment.db.getAllFrom('files');
      expect(stored).toHaveLength(2);
    });

    it('returns empty array when documents list is empty', async () => {
      const handler = createHandler();
      const result = await handler.saveMultiple([]);

      expect(result).toEqual([]);
    });

    it('throws when any document is missing _id', async () => {
      const handler = createHandler();

      await expect(handler.saveMultiple([{ originalname: 'no-id.pdf' } as any])).rejects.toThrow(
        'MongoFilesSyncHandler: document._id is required'
      );
    });

    it('updates existing rows and returns them', async () => {
      const id = new ObjectId();
      await testingEnvironment.setUp({
        files: [
          {
            _id: id,
            originalname: 'before.pdf',
            filename: 'before.pdf',
            mimetype: 'application/pdf',
            size: 100,
            creationDate: Date.now(),
            type: 'custom',
          },
        ],
      });

      const handler = createHandler();
      const result = await handler.saveMultiple([
        {
          _id: id.toHexString(),
          originalname: 'after.pdf',
          filename: 'after.pdf',
          mimetype: 'application/pdf',
          size: 200,
          creationDate: Date.now(),
          type: 'custom',
        } as any,
      ]);

      expect(result).toHaveLength(1);
      expect(result[0].originalname).toBe('after.pdf');
    });

    it('should strip tenant_id from all documents when saving multiple', async () => {
      const handler = createHandler();
      const id1 = new ObjectId().toHexString();
      const id2 = new ObjectId().toHexString();

      await handler.saveMultiple([
        {
          _id: id1,
          originalname: 'file1.pdf',
          filename: 'file1.pdf',
          mimetype: 'application/pdf',
          size: 100,
          creationDate: Date.now(),
          type: 'custom',
          tenant_id: 'tenant-a',
        } as any,
        {
          _id: id2,
          originalname: 'file2.pdf',
          filename: 'file2.pdf',
          mimetype: 'application/pdf',
          size: 200,
          creationDate: Date.now(),
          type: 'custom',
          tenant_id: 'tenant-b',
        } as any,
      ]);

      const stored = await testingEnvironment.db.getAllFrom('files');
      expect(stored).toHaveLength(2);
      stored.forEach(doc => {
        expect((doc as any).tenant_id).toBeUndefined();
      });
    });
  });

  describe('delete', () => {
    it('removes a file row', async () => {
      const file = baseFile({ type: 'custom' });
      await testingEnvironment.setUp({ files: [file] });

      const handler = createHandler();
      await handler.delete(file._id.toHexString());

      const stored = await testingEnvironment.db.getAllFrom('files');
      expect(stored).toHaveLength(0);
    });

    it('does not throw when deleting a non-existent id', async () => {
      const handler = createHandler();

      await expect(handler.delete(new ObjectId().toHexString())).resolves.not.toThrow();
    });
  });
});
