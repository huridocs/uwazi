import SettingsAPI from '../../Settings/SettingsAPI.js';
// @ts-expect-error TS(2307): Cannot find module '../../config.js.js' or its cor... Remove this comment to see the full error message
import { APIURL } from '../../config.js.js';
import backend from 'fetch-mock';
// @ts-expect-error TS(2307): Cannot find module '../../api/utils/jasmineHelpers... Remove this comment to see the full error message
import { catchErrors } from 'api/utils/jasmineHelpers.js';
import { RequestParams } from '../../utils/RequestParams.js';

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
