import db from 'api/utils/testing_db';
import { catchErrors } from 'api/utils/jasmineHelpers';

import request from 'shared/JSONRequest';
import fixtures, { newDoc1, newDoc2, newDoc3, newDoc4 } from './fixtures';
import syncWorker from '../syncWorker';

import 'api/entities';
import 'api/relationships';

// import syncModel from '../syncModel';

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

    await syncWorker.syncronize();

    expect(request.post).toHaveBeenCalledWith('url', {
      namespace: 'entities',
      data: {
        _id: newDoc1,
        title: 'a new entity',
      }
    });
  });
});
