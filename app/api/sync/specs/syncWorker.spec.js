import syncWorker from '../syncWorker';
import request from 'shared/JSONRequest';
import { newDoc1, newDoc2, newDoc3, newDoc4 } from './fixtures'

describe('syncWorker', () => {
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
