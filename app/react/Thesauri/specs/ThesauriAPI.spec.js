/** @format */

import thesauriAPI from 'app/Thesauri/ThesauriAPI';
import { APIURL } from 'app/config.js';
import backend from 'fetch-mock';
import { RequestParams } from 'app/utils/RequestParams';

describe('ThesauriAPI', () => {
  const arrayResponse = [{ thesauris: 'array' }];
  const singleResponse = [{ thesauris: 'single' }];

  beforeEach(() => {
    backend.restore();
    backend
      .get(`${APIURL}thesauris`, { body: JSON.stringify({ rows: arrayResponse }) })
      .get(`${APIURL}thesauris?_id=thesauriId`, { body: JSON.stringify({ rows: singleResponse }) })
      .delete(`${APIURL}thesauris?_id=id`, {
        body: JSON.stringify({ backendResponse: 'testdelete' }),
      })
      .post(`${APIURL}thesauris`, { body: JSON.stringify({ backendResponse: 'test' }) });
  });

  afterEach(() => backend.restore());

  describe('get()', () => {
    it('should request thesauris', done => {
      thesauriAPI
        .get()
        .then(response => {
          expect(response).toEqual(arrayResponse);
          done();
        })
        .catch(done.fail);
    });
  });

  describe('save()', () => {
    it('should post the thesaurus data to /thesauris', done => {
      const data = { name: 'thesaurus name', properties: [] };
      thesauriAPI
        .save(new RequestParams(data))
        .then(response => {
          expect(JSON.parse(backend.lastOptions(`${APIURL}thesauris`).body)).toEqual(data);
          expect(response).toEqual({ backendResponse: 'test' });
          done();
        })
        .catch(done.fail);
    });
  });

  describe('delete()', () => {
    it('should delete the thesauri', done => {
      const data = { _id: 'id' };
      const request = { data };
      thesauriAPI
        .delete(request)
        .then(response => {
          expect(response).toEqual({ backendResponse: 'testdelete' });
          done();
        })
        .catch(done.fail);
    });
  });
});
