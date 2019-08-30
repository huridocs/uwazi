import { APIURL } from 'app/config.js';
import { activitylogSearch } from 'app/Activitylog/actions/activitylogActions';
import backend from 'fetch-mock';

describe('activitylog actions', () => {
  describe('activitylogSearch', () => {
    beforeEach(() => {
      backend
      .get(`${APIURL}activitylog?limit=2&url=entities`, {
        body: JSON.stringify({ url: '/api/entities', rows: [{ some: 'results' }] })
      });
    });

    it('should search for entries with the given query', async () => {
      const dispatch = jasmine.createSpy('dispatch');
      await activitylogSearch({ limit: 2, url: 'entities' })(dispatch);
      expect(dispatch).toHaveBeenCalledWith({ type: 'activitylog/search/SET', value: { url: '/api/entities', rows: [{ some: 'results' }] } });
      expect(dispatch).toHaveBeenCalledWith({ type: 'activitylog/list/SET', value: [{ some: 'results' }] });
    });
  });
});
