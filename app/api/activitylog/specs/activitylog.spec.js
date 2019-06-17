import db from 'api/utils/testing_db';
import activitylog from '../activitylog';
import model from '../activitylogModel';
import fixtures from './fixtures';

describe('activitylog', () => {
  beforeEach(async () => {
    await db.clearAllAndLoad(fixtures);
  });

  afterAll(async () => {
    await db.disconnect();
  });

  describe('save()', () => {
    it('should save the entry', () => {
      spyOn(model, 'save');
      activitylog.save({ method: 'POST', url: '/api/entities' });
      expect(model.save).toHaveBeenCalledWith({ method: 'POST', url: '/api/entities' });
    });
  });

  describe('get()', () => {
    it('should return the entries', async () => {
      const entries = await activitylog.get();
      expect(entries.length).toBe(5);
    });

    it('should filter by method', async () => {
      const entries = await activitylog.get({ method: ['POST'] });
      expect(entries.length).toBe(1);
      expect(entries[0].method).toBe('POST');
    });

    it('should filter by time', async () => {
      const entries = await activitylog.get({ time: { from: 1560856543, to: 1561029343 } });
      expect(entries.length).toBe(1);
      expect(entries[0].method).toBe('GET');
    });

    it('should filter by url', async () => {
      const entries = await activitylog.get({ url: 'entities' });
      expect(entries.length).toBe(4);
    });

    it('should filter by query', async () => {
      const entries = await activitylog.get({ query: '123' });
      expect(entries.length).toBe(1);
      expect(entries[0].query).toBe('{"sharedId":"123"}');
    });

    it('should filter by body', async () => {
      const entries = await activitylog.get({ body: 'Hello' });
      expect(entries.length).toBe(1);
      expect(entries[0].body).toBe('{"_id":"123","title":"Hello"}');
    });

    it('should filter by username', async () => {
      const entries = await activitylog.get({ username: 'admin' });
      expect(entries.length).toBe(2);
    });
  });
});
