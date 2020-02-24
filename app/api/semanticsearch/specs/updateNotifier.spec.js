import { UpdateNotifier } from '../updateNotifier';
import semanticSearch from '../semanticSearch';

describe('updateNotifier', () => {
  let notifier;
  beforeEach(() => {
    notifier = new UpdateNotifier();
  });

  describe('addRequest', () => {
    it('add request to notifier', () => {
      const req = { session: { id: 'req1' } };
      notifier.addRequest(req);
      expect(notifier.requests.req1).toEqual(req);
    });
  });

  describe('deleteRequest', () => {
    it('should remove request from notifier', () => {
      const req = { session: { id: 'req1' } };
      notifier.addRequest(req);
      notifier.deleteRequest('req1');
      expect(notifier.requests.req1).toBeUndefined();
    });
  });

  describe('notifySearchUpdate', () => {
    let updates;
    beforeEach(() => {
      jest
        .spyOn(semanticSearch, 'getDocumentResultsByIds')
        .mockResolvedValue(['doc1Res', 'doc2Res']);
      updates = { updatedSearch: { _id: 'search' }, processedDocuments: ['res1', 'res2'] };
    });

    const makeRequest = (id, sockets) => ({
      session: { id },
      getCurrentSessionSockets: jest.fn().mockReturnValue(sockets),
    });

    it('should fetched updated docs and send updates to all tracked sessions', async () => {
      const socks1 = { sockets: ['s1', 's2'], emit: jest.fn() };
      const socks2 = { sockets: ['s3', 's4'], emit: jest.fn() };
      const reqs = [makeRequest('req1', socks1), makeRequest('req2', socks2)];
      reqs.forEach(req => notifier.addRequest(req));
      await notifier.notifySearchUpdate('searchId', updates);
      [socks1, socks2].forEach(sock => {
        expect(sock.emit).toHaveBeenCalledWith('semanticSearchUpdated', {
          updatedSearch: { _id: 'search' },
          docs: ['doc1Res', 'doc2Res'],
        });
      });
    });
    it('should remove closed sessions', async () => {
      const socks1 = { sockets: [], emit: jest.fn() };
      const req = makeRequest('req', socks1);
      notifier.addRequest(req);
      jest.spyOn(notifier, 'deleteRequest');
      await notifier.notifySearchUpdate('searchId', updates);
      expect(notifier.deleteRequest).toHaveBeenCalledWith('req');
    });
  });
});
