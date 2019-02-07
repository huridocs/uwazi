import Worker from '../worker';
import semanticSearch from '../semanticSearch';

describe('worker', () => {
  describe('start', () => {
    it('should process documents in the search in batches and emit event when done', (done) => {
      jest.spyOn(semanticSearch, 'processSearchLimit')
      .mockResolvedValueOnce({ status: 'inProgress' })
      .mockResolvedValueOnce({ status: 'inProgress' })
      .mockResolvedValueOnce({ status: 'completed' });

      const searchId = 'search';
      const batchSize = 5;

      const worker = new Worker(searchId, batchSize);
      worker.start();

      worker.on('done', () => {
        expect(semanticSearch.processSearchLimit).toHaveBeenCalledTimes(3);
        expect(semanticSearch.processSearchLimit.mock.calls).toMatchSnapshot();
        done();
      });
    });
    it('should emit error event when an error occurs', (done) => {
      const error = new Error('error');
      jest.spyOn(semanticSearch, 'processSearchLimit')
      .mockResolvedValueOnce({ status: 'inProgress' })
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce({ status: 'completed' });

      const worker = new Worker('search', 5);
      worker.start();

      worker.on('error', (e) => {
        expect(e).toEqual(error);
        done();
      });
      worker.on('done', () => {
        fail('should emit error');
        done();
      });
    });
  });
});
