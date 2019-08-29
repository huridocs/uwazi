import db from 'api/utils/testing_db';
import activitylog from '../activitylog';
import * as activityLogParser from '../activitylogParser';
import fixtures from './fixtures';

describe('activitylog', () => {
  beforeEach(async () => {
    await db.clearAllAndLoad(fixtures);
    spyOn(activityLogParser, 'getSemanticData').and.returnValue(Promise.resolve({ beautified: true }));
  });

  afterAll(async () => {
    await db.disconnect();
  });

  describe('save()', () => {
    it('should save the entry', async () => {
      await activitylog.save({ method: 'DELETE', url: '/api/thesauri' });
      const [log] = await activitylog.get({ url: '/api/thesauri' });
      expect(log.method).toBe('DELETE');
    });
  });

  describe('get()', () => {
    it('should return the entries', async () => {
      const entries = await activitylog.get();
      expect(entries.length).toBe(5);
    });

    it('should inlcude semantic info for each result', async () => {
      const entries = await activitylog.get();
      expect(activityLogParser.getSemanticData.calls.count()).toBe(5);
      expect(activityLogParser.getSemanticData).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'DELETE', query: '{"sharedId":"123"}', url: '/api/entities', username: 'admin' })
      );
      entries.forEach((e) => {
        expect(e.semantic).toEqual({ beautified: true });
      });
    });

    it('should filter by method', async () => {
      const entries = await activitylog.get({ method: ['POST'] });
      expect(entries.length).toBe(1);
      expect(entries[0].method).toBe('POST');
    });

    it('should filter by time', async () => {
      const entries = await activitylog.get({ time: { from: 1560856543, to: 1561029343 } });
      expect(entries.length).toBe(1);
      expect(entries[0].method).toBe('PUT');
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
