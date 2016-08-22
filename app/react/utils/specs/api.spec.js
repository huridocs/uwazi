import {APIURL} from 'app/config';
import api from 'app/utils/api';
import backend from 'fetch-mock';
import {browserHistory} from 'react-router';
import * as notifyActions from 'app/Notifications/actions/notificationsActions';
import {store} from 'app/store';

describe('Login', () => {
  beforeEach(() => {
    backend.restore();
    backend
    .mock(APIURL + 'test_get', 'GET', JSON.stringify({method: 'GET'}))
    .mock(APIURL + 'test_post', 'POST', JSON.stringify({method: 'POST'}))
    .mock(APIURL + 'test_delete?data=delete', 'DELETE', JSON.stringify({method: 'DELETE'}))
    .mock(APIURL + 'unauthorised', 'GET', {status: 401, body: {}})
    .mock(APIURL + 'error_url', 'GET', {status: 500, body: {}});
  });


  describe('GET', () => {
    it('should prefix url with config api url', (done) => {
      api.get('test_get')
      .then((response) => {
        expect(response.json.method).toBe('GET');
        done();
      })
      .catch(done.fail);
    });

    describe('when authorizing', () => {
      it('should send the authorization in the headers', (done) => {
        api.authorize('cookie');
        api.get('test_get')
        .then(() => {
          let headers = backend.calls().matched[0][1].headers;
          expect(headers.Cookie).toBe('cookie');

          done();
        })
        .catch(done.fail);
      });
    });
  });

  describe('POST', () => {
    it('should prefix url with config api url', (done) => {
      api.post('test_post', {data: 'post'})
      .then((response) => {
        expect(backend.calls().matched[0][1].body).toBe(JSON.stringify({data: 'post'}));
        expect(response.json.method).toBe('POST');
        done();
      })
      .catch(done.fail);
    });
  });

  describe('DELETE', () => {
    it('should prefix url with config api url', (done) => {
      api.delete('test_delete', {data: 'delete'})
      .then((response) => {
        expect(response.json.method).toBe('DELETE');
        done();
      })
      .catch(done.fail);
    });
  });

  describe('error handling', () => {
    describe('401', () => {
      it('should redirect to login', (done) => {
        spyOn(browserHistory, 'replace');
        api.get('unauthorised')
        .catch(() => {
          expect(browserHistory.replace).toHaveBeenCalledWith('/login');
          done();
        });
      });
    });

    it('should notify the user', (done) => {
      spyOn(store, 'dispatch');
      spyOn(notifyActions, 'notify').and.returnValue('notify action');
      api.get('error_url')
      .catch(() => {
        expect(store.dispatch).toHaveBeenCalledWith('notify action');
        expect(notifyActions.notify).toHaveBeenCalledWith('An error has occurred', 'warning');
        done();
      });
    });
  });
});
