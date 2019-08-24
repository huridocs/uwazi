import thesaurisAPI from 'app/Thesauris/ThesaurisAPI';
import { APIURL } from 'app/config.js';
import backend from 'fetch-mock';
import { RequestParams } from 'app/utils/RequestParams';


describe('ThesaurisAPI', () => {
  const arrayResponse = [{ thesauris: 'array' }];
  const singleResponse = [{ thesauris: 'single' }];

  beforeEach(() => {
    backend.restore();
    backend
    .get(`${APIURL}thesauris`, { body: JSON.stringify({ rows: arrayResponse }) })
    .get(`${APIURL}thesauris?_id=thesauriId`, { body: JSON.stringify({ rows: singleResponse }) })
    .delete(`${APIURL}thesauris?_id=id`, { body: JSON.stringify({ backednResponse: 'testdelete' }) })
    .post(`${APIURL}thesauris`, { body: JSON.stringify({ backednResponse: 'test' }) });
  });

  afterEach(() => backend.restore());

  describe('get()', () => {
    it('should request thesauris', (done) => {
      thesaurisAPI.get()
      .then((response) => {
        expect(response).toEqual(arrayResponse);
        done();
      })
      .catch(done.fail);
    });
  });

  describe('save()', () => {
    it('should post the thesauri data to /thesauris', (done) => {
      const data = { name: 'thesauri name', properties: [] };
      thesaurisAPI.save(new RequestParams(data))
      .then((response) => {
        expect(JSON.parse(backend.lastOptions(`${APIURL}thesauris`).body)).toEqual(data);
        expect(response).toEqual({ backednResponse: 'test' });
        done();
      })
      .catch(done.fail);
    });
  });

  describe('delete()', () => {
    it('should delete the thesauri', (done) => {
      const data = { _id: 'id' };
      const request = { data };
      thesaurisAPI.delete(request)
      .then((response) => {
        expect(response).toEqual({ backednResponse: 'testdelete' });
        done();
      })
      .catch(done.fail);
    });
  });
});
