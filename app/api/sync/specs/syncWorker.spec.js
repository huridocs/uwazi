import db from 'api/utils/testing_db';
import { catchErrors } from 'api/utils/jasmineHelpers';

import request from 'shared/JSONRequest';
import 'api/entities';
import 'api/relationships';

import fixtures, { newDoc1, newDoc2, newDoc3, newDoc4 } from './fixtures';
import syncWorker from '../syncWorker';

describe('syncWorker', () => {
  beforeEach((done) => {
    db.clearAllAndLoad(fixtures).then(done).catch(catchErrors(done));
  });

  afterAll((done) => {
    db.disconnect().then(done);
  });

  it('should process the log records newer than the current sync time (minus 1 sec)', async () => {
    spyOn(request, 'post').and.returnValue(Promise.resolve());
    spyOn(request, 'delete').and.returnValue(Promise.resolve());

    await syncWorker.syncronize('url');

    expect(request.post.calls.count()).toBe(3);
    expect(request.delete.calls.count()).toBe(1);

    expect(request.post).toHaveBeenCalledWith('url', {
      namespace: 'entities',
      data: {
        _id: newDoc1,
        title: 'a new entity',
      }
    });

    expect(request.post).toHaveBeenCalledWith('url', {
      namespace: 'entities',
      data: {
        _id: newDoc2,
        title: 'another new entity',
      }
    });

    expect(request.post).toHaveBeenCalledWith('url', {
      namespace: 'connections',
      data: {
        _id: newDoc3,
        entity: newDoc1
      }
    });

    expect(request.delete).toHaveBeenCalledWith('url', {
      namespace: 'entities',
      data: {
        _id: newDoc4
      }
    });
  });

  describe('intervalSync', () => {
    it('should syncronize every x seconds', async () => {
      let syncCalls = 0;
      spyOn(syncWorker, 'syncronize').and.callFake(() => {
        if (syncCalls === 2) {
          syncWorker.stop();
        }
        syncCalls += 1;
        return Promise.resolve();
      });

      const interval = 0;
      await syncWorker.intervalSync('url', interval);
      expect(syncWorker.syncronize).toHaveBeenCalledWith('url');
      expect(syncWorker.syncronize).toHaveBeenCalledTimes(3);
    });
  });

  describe('start', () => {
    it('should get sync config and start the sync', async () => {
      spyOn(syncWorker, 'intervalSync');
      const interval = 2000;

      await syncWorker.start(interval);
      expect(syncWorker.intervalSync).toHaveBeenCalledWith('url', interval);
    });
  });
});
