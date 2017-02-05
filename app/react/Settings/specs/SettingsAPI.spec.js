import SettingsAPI from 'app/Settings/SettingsAPI';
import {APIURL} from 'app/config.js';
import backend from 'fetch-mock';
import {catchErrors} from 'api/utils/jasmineHelpers';

describe('SettingsAPI', () => {
  beforeEach(() => {
    backend.restore();
    backend
    .post(APIURL + 'settings', {body: JSON.stringify('ok')})
    .get(APIURL + 'settings', {body: JSON.stringify({site_name: 'Uwazi'})});
  });

  afterEach(() => backend.restore());

  describe('save()', () => {
    let settings;

    beforeEach(() => {
      settings = {
        site_name: 'My name',
        _id: '123'
      };
    });

    it('should post to users', (done) => {
      SettingsAPI.save(settings)
      .then((response) => {
        expect(response).toEqual('ok');
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('currentUser()', () => {
    it('should request the logged in user', (done) => {
      SettingsAPI.get()
      .then((response) => {
        expect(response).toEqual({site_name: 'Uwazi'});
        done();
      })
      .catch(catchErrors(done));
    });
  });
});
