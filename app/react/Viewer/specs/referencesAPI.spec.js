import referencesAPI from 'app/Viewer/referencesAPI';
import { APIURL } from 'app/config.js';
import { RequestParams } from 'app/utils/RequestParams';
import backend from 'fetch-mock';

describe('referencesAPI', () => {
  const byDocumentResponse = [{ documents: 'array' }];
  const groupByConnectionResponse = [{ connections: 'array' }];
  const searchResponse = [{ results: 'array' }];
  const searchSortedResponse = [{ results: 'sorted array' }];

  beforeEach(() => {
    backend.restore();
    backend
      .get(`${APIURL}references/by_document?sharedId=sourceDocument`, {
        body: JSON.stringify(byDocumentResponse),
      })
      .get(`${APIURL}references/group_by_connection?sharedId=sourceDocument`, {
        body: JSON.stringify(groupByConnectionResponse),
      })
      .get(`${APIURL}references/search?sharedId=sourceDocument`, {
        body: JSON.stringify(searchResponse),
      })
      .get(`${APIURL}references/search?sharedId=sourceDocument&sort=title`, {
        body: JSON.stringify(searchSortedResponse),
      })
      .get(`${APIURL}references/count_by_relationtype?sharedId=abc1`, { body: '2' })
      .delete(`${APIURL}references?_id=id`, {
        body: JSON.stringify({ backendResponse: 'testdelete' }),
      })
      .post(`${APIURL}references`, { body: JSON.stringify({ backednResponse: 'test' }) });
  });

  afterEach(() => backend.restore());

  describe('get()', () => {
    it('should request references', async () => {
      const requestParams = new RequestParams({ sharedId: 'sourceDocument' });
      const response = await referencesAPI.get(requestParams);
      expect(response).toEqual(byDocumentResponse);
    });
  });

  describe('getGroupedByConnection()', () => {
    it('should request grouped references', done => {
      const requestParams = new RequestParams({ sharedId: 'sourceDocument' });
      referencesAPI
        .getGroupedByConnection(requestParams)
        .then(response => {
          expect(response).toEqual(groupByConnectionResponse);
          done();
        })
        .catch(done.fail);
    });
  });

  describe('search()', () => {
    it('should search references', done => {
      const requestParams = new RequestParams({ sharedId: 'sourceDocument' });
      referencesAPI
        .search(requestParams)
        .then(response => {
          expect(response).toEqual(searchResponse);
          done();
        })
        .catch(done.fail);
    });

    it('should search references with additional options', done => {
      const requestParams = new RequestParams({ sharedId: 'sourceDocument', sort: 'title' });
      referencesAPI
        .search(requestParams)
        .then(response => {
          expect(response).toEqual(searchSortedResponse);
          done();
        })
        .catch(done.fail);
    });
  });

  describe('save()', () => {
    it('should post the document data to /references', done => {
      const data = { name: 'document name' };
      const requestParams = new RequestParams(data);
      referencesAPI
        .save(requestParams)
        .then(response => {
          expect(JSON.parse(backend.lastOptions(`${APIURL}references`).body)).toEqual(data);
          expect(response).toEqual({ backednResponse: 'test' });
          done();
        })
        .catch(done.fail);
    });
  });

  describe('delete()', () => {
    it('should delete the document', done => {
      const requestParams = new RequestParams({ _id: 'id' });
      referencesAPI
        .delete(requestParams)
        .then(response => {
          expect(response).toEqual({ backendResponse: 'testdelete' });
          done();
        })
        .catch(done.fail);
    });
  });

  describe('countByRelationType()', () => {
    it('should request references', done => {
      const requestParams = new RequestParams({ sharedId: 'abc1' });
      referencesAPI
        .countByRelationType(requestParams)
        .then(response => {
          expect(response).toEqual(2);
          done();
        })
        .catch(done.fail);
    });
  });
});
