import { ObjectId } from 'mongodb';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { MongoTemplatesSyncHandler } from '#api/sync/MongoTemplatesSyncHandler.js';

const factory = () => new MongoTemplatesSyncHandler();

describe('MongoTemplatesSyncHandler', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp({
      templates: [],
    });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('save', () => {
    it('should upsert the template', async () => {
      const handler = factory();
      const id = new ObjectId();
      await handler.save({ _id: id.toHexString(), name: 'Synced template', properties: [] } as any);

      const stored = await testingEnvironment.db.getAllFrom('templates');
      expect(stored).toMatchObject([{ _id: id, name: 'Synced template' }]);
    });

    it('should unset the previous default when saving a new default template', async () => {
      const previousDefaultId = new ObjectId();
      const newDefaultId = new ObjectId();
      await testingEnvironment.setUp({
        templates: [
          {
            _id: previousDefaultId,
            name: 'Previous default',
            default: true,
            properties: [],
          },
        ],
      });

      const handler = factory();
      await handler.save({
        _id: newDefaultId.toHexString(),
        name: 'New default',
        default: true,
        properties: [],
      } as any);

      const stored = await testingEnvironment.db.getAllFrom('templates');
      const previousDefault = stored.find(t => t._id.toString() === previousDefaultId.toString());
      const newDefault = stored.find(t => t._id.toString() === newDefaultId.toString());

      expect(previousDefault?.default).toBe(false);
      expect(newDefault?.default).toBe(true);
    });

    it('should not unset itself when the saved template is already the default', async () => {
      const id = new ObjectId();
      await testingEnvironment.setUp({
        templates: [
          {
            _id: id,
            name: 'Default',
            default: true,
            properties: [],
          },
        ],
      });

      const handler = factory();
      await handler.save({
        _id: id.toHexString(),
        name: 'Default updated',
        default: true,
        properties: [],
      } as any);

      const stored = await testingEnvironment.db.getAllFrom('templates');
      expect(stored).toHaveLength(1);
      expect(stored[0].default).toBe(true);
      expect(stored[0].name).toBe('Default updated');
    });
  });

  describe('saveMultiple', () => {
    it('should upsert multiple templates', async () => {
      const handler = factory();
      const id1 = new ObjectId().toHexString();
      const id2 = new ObjectId().toHexString();
      await handler.saveMultiple([
        { _id: id1, name: 'Template 1', properties: [] } as any,
        { _id: id2, name: 'Template 2', properties: [] } as any,
      ]);

      const stored = await testingEnvironment.db.getAllFrom('templates');
      expect(stored).toHaveLength(2);
    });

    it('should unset the previous default when one of the synced templates is default', async () => {
      const previousDefaultId = new ObjectId();
      const newDefaultId = new ObjectId();
      await testingEnvironment.setUp({
        templates: [
          {
            _id: previousDefaultId,
            name: 'Previous default',
            default: true,
            properties: [],
          },
        ],
      });

      const handler = factory();
      await handler.saveMultiple([
        {
          _id: newDefaultId.toHexString(),
          name: 'New default',
          default: true,
          properties: [],
        } as any,
        { _id: new ObjectId().toHexString(), name: 'Other', properties: [] } as any,
      ]);

      const stored = await testingEnvironment.db.getAllFrom('templates');
      const previousDefault = stored.find(t => t._id.toString() === previousDefaultId.toString());
      const newDefault = stored.find(t => t._id.toString() === newDefaultId.toString());

      expect(previousDefault?.default).toBe(false);
      expect(newDefault?.default).toBe(true);
    });
  });

  describe('getById', () => {
    it('should return the template by id', async () => {
      const id = new ObjectId();
      await testingEnvironment.setUp({
        templates: [
          {
            _id: id,
            name: 'Template',
            properties: [],
          },
        ],
      });

      const handler = factory();
      const result = await handler.getById(id.toHexString());
      expect(result?.name).toBe('Template');
    });

    it('should return null when the template does not exist', async () => {
      const handler = factory();
      const result = await handler.getById(new ObjectId().toHexString());
      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete the template by id', async () => {
      const id = new ObjectId();
      await testingEnvironment.setUp({
        templates: [
          {
            _id: id,
            name: 'Template',
            properties: [],
          },
        ],
      });

      const handler = factory();
      await handler.delete(id.toHexString());

      const stored = await testingEnvironment.db.getAllFrom('templates');
      expect(stored).toHaveLength(0);
    });
  });
});
