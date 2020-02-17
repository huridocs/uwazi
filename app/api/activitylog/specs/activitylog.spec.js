import db from 'api/utils/testing_db';
import activitylog from '../activitylog';
import * as activityLogParser from '../activitylogParser';
import fixtures from './fixtures';

describe('activitylog', () => {
  beforeEach(async () => {
    await db.clearAllAndLoad(fixtures);
    spyOn(activityLogParser, 'getSemanticData').and.returnValue(
      Promise.resolve({ beautified: true })
    );
  });

  afterAll(async () => {
    await db.disconnect();
  });

  describe('save()', () => {
    it('should save the entry', async () => {
      await activitylog.save({ method: 'DELETE', url: '/api/thesauri' });
      const {
        rows: [log],
      } = await activitylog.get({ url: '/api/thesauri' });
      expect(log.method).toBe('DELETE');
    });
  });

  describe('get()', () => {
    it('should return the entries, excluding certain routes (that should be logged, and not presented)', async () => {
      const { rows: entries } = await activitylog.get();
      expect(entries.length).toBe(5);
    });

    it('should inlcude semantic info for each result', async () => {
      const { rows: entries } = await activitylog.get();
      expect(activityLogParser.getSemanticData.calls.count()).toBe(5);
      expect(activityLogParser.getSemanticData).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'DELETE',
          query: '{"sharedId":"123"}',
          url: '/api/entities',
          username: 'admin',
        })
      );
      entries.forEach(e => {
        expect(e.semantic).toEqual({ beautified: true });
      });
    });

    it('should filter by method', async () => {
      const { rows: entries } = await activitylog.get({ method: ['POST'] });
      expect(entries.length).toBe(1);
      expect(entries[0].method).toBe('POST');
    });

    it('should filter by time', async () => {
      let { rows: entries } = await activitylog.get({ time: { from: 5, to: 6 } });
      expect(entries.length).toBe(2);
      expect(entries[0].time).toBe(6000);
      expect(entries[1].time).toBe(5000);

      ({ rows: entries } = await activitylog.get({ time: { from: null } }));
      expect(entries.length).toBe(5);

      ({ rows: entries } = await activitylog.get({ time: { to: null } }));
      expect(entries.length).toBe(5);
    });

    it('should filter by url', async () => {
      const { rows: entries } = await activitylog.get({ url: 'entities' });
      expect(entries.length).toBe(4);
    });

    it('should filter by query', async () => {
      const { rows: entries } = await activitylog.get({ query: '123' });
      expect(entries.length).toBe(1);
      expect(entries[0].query).toBe('{"sharedId":"123"}');
    });

    it('should filter by body', async () => {
      const { rows: entries } = await activitylog.get({ body: 'Hello' });
      expect(entries.length).toBe(1);
      expect(entries[0].body).toBe('{"_id":"123","title":"Hello"}');
    });

    it('should filter by username', async () => {
      const { rows: entries } = await activitylog.get({ username: 'admin' });
      expect(entries.length).toBe(2);
    });

    it('should allow a general find query of terms', async () => {
      const { rows: entries } = await activitylog.get({ find: 'Hello' });
      expect(entries.length).toBe(3);
      expect(entries[0].time).toBe(8000);
      expect(entries[1].time).toBe(6000);
      expect(entries[2].time).toBe(5000);
    });

    describe('Load More functionality', () => {
      const assessResults = (results, expected) => {
        expect(results.rows.length).toBe(expected.size);
        expect(results.remainingRows).toBe(expected.remainingRows);
        expect(results.limit).toBe(expected.limit);
        expect(results.rows[0].time).toBe(expected.initialTime);
      };

      it('should allow to load more via "before" param', async () => {
        const initialResults = await activitylog.get({ limit: 2 });
        assessResults(initialResults, { size: 2, remainingRows: 3, limit: 2, initialTime: 8000 });

        const nextResults = await activitylog.get({ before: 6000, limit: 2 });
        assessResults(nextResults, { size: 2, remainingRows: 1, limit: 2, initialTime: 5000 });
      });
    });
  });
});
