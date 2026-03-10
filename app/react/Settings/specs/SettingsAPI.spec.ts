import SettingsAPI from 'app/Settings/SettingsAPI';
import { APIURL } from 'app/config.js';
import backend from 'fetch-mock';
import { catchErrors } from 'api/utils/jasmineHelpers';
import { RequestParams } from 'app/utils/RequestParams';

describe('SettingsAPI', () => {
  beforeEach(() => {
    backend.restore();
    backend
      .post(`${APIURL}settings`, { body: JSON.stringify('ok') })
      .get(`${APIURL}settings`, { body: JSON.stringify({ site_name: 'Uwazi' }) })
      .get(`${APIURL}stats`, { body: JSON.stringify({ files: { total: 3 } }) });
  });

  afterEach(() => backend.restore());

  describe('save()', () => {
    let settings: RequestParams;

    beforeEach(() => {
      settings = new RequestParams({
        site_name: 'My name',
        _id: '123',
      });
    });

    it('should post to users', done => {
      SettingsAPI.save(settings)
        .then(response => {
          expect(response).toEqual('ok');
          done();
        })
        .catch(catchErrors(done));
    });
  });

  describe('currentUser()', () => {
    it('should request the logged in user', done => {
      SettingsAPI.get()
        .then(response => {
          expect(response).toEqual({ site_name: 'Uwazi' });
          done();
        })
        .catch(catchErrors(done));
    });
  });

  describe('stats()', () => {
    it('should request the site stats', done => {
      SettingsAPI.stats()
        .then(response => {
          expect(response).toEqual({ files: { total: 3 } });
          done();
        })
        .catch(catchErrors(done));
    });
  });
});
