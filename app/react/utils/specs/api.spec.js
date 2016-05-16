import {APIURL} from 'app/config';
import api from 'app/utils/api';
import backend from 'fetch-mock';
import {browserHistory} from 'react-router';

describe('Login', () => {
  beforeEach(() => {
    backend.restore();
    backend
    .mock(APIURL + 'test_get', 'GET', JSON.stringify({method: 'GET'}))
    .mock(APIURL + 'test_post', 'POST', JSON.stringify({method: 'POST'}))
    .mock(APIURL + 'test_delete?data=delete', 'DELETE', JSON.stringify({method: 'DELETE'}))
    .mock(APIURL + 'unauthorised_get', 'GET', {status: 401, body: {}})
    .mock(APIURL + 'unauthorised_post', 'POST', {status: 401, body: {}})
    .mock(APIURL + 'unauthorised_delete', 'DELETE', {status: 401, body: {}});
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

    describe('handles 401', () => {
      it('should redirect to login', (done) => {
        spyOn(browserHistory, 'replace');
        api.get('unauthorised_get')
        .catch(() => {
          expect(browserHistory.replace).toHaveBeenCalledWith('/login');
          done();
        });
      });
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

    describe('handles 401', () => {
      it('should redirect to login', (done) => {
        spyOn(browserHistory, 'replace');
        api.post('unauthorised_post')
        .catch(() => {
          expect(browserHistory.replace).toHaveBeenCalledWith('/login');
          done();
        });
      });
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

    describe('handles 401', () => {
      it('should redirect to login', (done) => {
        spyOn(browserHistory, 'replace');
        api.delete('unauthorised_delete')
        .catch(() => {
          expect(browserHistory.replace).toHaveBeenCalledWith('/login');
          done();
        });
      });
    });
  });
});
