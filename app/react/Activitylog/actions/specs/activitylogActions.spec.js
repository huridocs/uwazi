import { APIURL } from 'app/config.js';
import {
  activitylogSearch,
  activitylogSearchMore,
} from 'app/Activitylog/actions/activitylogActions';
import backend from 'fetch-mock';

describe('activitylog actions', () => {
  beforeEach(() => {
    backend.restore();
    backend.get(`${APIURL}activitylog?limit=2&url=entities`, {
      body: JSON.stringify({ url: '/api/entities', rows: [{ some: 'results' }] }),
    });
  });

  const checkDispatch = async (action, method) => {
    const dispatch = jasmine.createSpy('dispatch');
    await action({ limit: 2, url: 'entities' })(dispatch);
    expect(dispatch).toHaveBeenCalledWith({
      type: 'activitylog/search/SET',
      value: { url: '/api/entities', rows: [{ some: 'results' }] },
    });
    expect(dispatch).toHaveBeenCalledWith({
      type: `activitylog/list/${method}`,
      value: [{ some: 'results' }],
    });
  };

  describe('activitylogSearch', () => {
    it('should search for entries with the given query and store results', async () => {
      checkDispatch(activitylogSearch, 'SET');
    });
  });

  describe('activitylogSearchMore', () => {
    it('should search for entries with the given query and append results', async () => {
      checkDispatch(activitylogSearchMore, 'CONCAT');
    });
  });
});
