import backend from 'fetch-mock';
import request from '../JSONRequest';

describe('JSONRequest', () => {
  beforeEach(() => {
    backend.restore();
    backend
    .mock('http://localhost:3000/api/test', 'POST', JSON.stringify({response: 'post'}))
    .mock('http://localhost:3000/api/test', 'GET', JSON.stringify({response: 'get'}))
    .mock('http://localhost:3000/api/withParams?param1=param1&param2=%7B%22value%22%3A2%7D', 'GET', JSON.stringify({response: 'get with params'}))
    .mock('http://localhost:3000/api/test', 'DELETE', JSON.stringify({response: 'delete'}))
    .mock('http://localhost:3000/api/test?id=123', 'DELETE', JSON.stringify({response: 'delete with params'}));
  });

  describe('post()', () => {
    it('should POST to the url and return the response json and the status', (done) => {
      request.post('http://localhost:3000/api/test')
      .then((response) => {
        expect(response.status).toBe(200);
        expect(response.json).toEqual({response: 'post'});
        done();
      })
      .catch(done.fail);
    });

    describe('when response is greater than 399', () => {
      it('should throw an error', (done) => {
        backend.reMock('http://localhost:3000/api/test', 'POST', {status: 400, body: JSON.stringify({error: 'error!'})});

        request.post('http://localhost:3000/api/test')
        .then(() => {
          done.fail('should have thrown an error');
        })
        .catch((response) => {
          expect(response.json.error).toBe('error!');
          expect(response.status).toBe(400);
          done();
        });
      });
    });
  });

  describe('get()', () => {
    it('should GET to the url and return the response json and the status', (done) => {
      request.get('http://localhost:3000/api/test')
      .then((response) => {
        expect(response.status).toBe(200);
        expect(response.json).toEqual({response: 'get'});
        done();
      })
      .catch(done.fail);
    });

    describe('when passing data', () => {
      it('should transform it to url params and not send a body', (done) => {
        request.get('http://localhost:3000/api/withParams', {param1: 'param1', param2: {value: 2}})
        .then((response) => {
          expect(response.status).toBe(200);
          expect(response.json).toEqual({response: 'get with params'});
          expect(backend.lastOptions().body).not.toBeDefined();
          done();
        })
        .catch(done.fail);
      });
    });

    describe('when passing a cookie', () => {
      it('should send the cookie in the headers', (done) => {
        request.get('http://localhost:3000/api/test', {}, 'cookie')
        .then(() => {
          let headers = backend.calls().matched[0][1].headers;
          expect(headers.Cookie).toBe('cookie');

          done();
        })
        .catch(done.fail);
      });
    });

    describe('when response is greater than 399', () => {
      it('should throw an error', (done) => {
        backend.reMock('http://localhost:3000/api/test', 'GET', {status: 500, body: JSON.stringify({error: 'error!'})});

        request.get('http://localhost:3000/api/test')
        .then(() => {
          done.fail('should have thrown an error');
        })
        .catch((response) => {
          expect(response.json.error).toBe('error!');
          expect(response.status).toBe(500);
          done();
        });
      });
    });
  });

  describe('delete()', () => {
    it('should DELETE to the url and return the response json and the status', (done) => {
      request.delete('http://localhost:3000/api/test')
      .then((response) => {
        expect(response.status).toBe(200);
        expect(response.json).toEqual({response: 'delete'});
        done();
      })
      .catch(done.fail);
    });

    describe('when passing data', () => {
      it('should send it in params', (done) => {
        request.delete('http://localhost:3000/api/test', {id: '123'})
        .then((response) => {
          expect(response.status).toBe(200);
          expect(response.json).toEqual({response: 'delete with params'});
          done();
        })
        .catch(done.fail);
      });
    });

    describe('when response is greater than 399', () => {
      it('should throw an error', (done) => {
        backend.reMock('http://localhost:3000/api/test', 'DELETE', {status: 404, body: JSON.stringify({error: 'error!'})});

        request.delete('http://localhost:3000/api/test')
        .then(() => {
          done.fail('should have thrown an error');
        })
        .catch((response) => {
          expect(response.status).toBe(404);
          expect(response.json.error).toBe('error!');
          done();
        });
      });
    });
  });
});
