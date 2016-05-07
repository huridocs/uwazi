import {APIURL} from 'app/config';
import api from 'app/utils/api';
import backend from 'fetch-mock';

describe('Login', () => {
  beforeEach(() => {
    backend.restore();
    backend
    .mock(APIURL + 'test_get', 'GET', JSON.stringify({method: 'GET'}))
    .mock(APIURL + 'test_post', 'POST', JSON.stringify({method: 'POST'}))
    .mock(APIURL + 'test_delete?data=delete', 'DELETE', JSON.stringify({method: 'DELETE'}));
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
});
