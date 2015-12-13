import backend from 'fetch-mock'
import request from '../JSONRequest'

describe('JSONRequest', () => {

  beforeEach(() => {
    backend.restore();
    backend
    .mock('http://localhost:3000/api/test', 'POST', JSON.stringify({response:'post'}))
    .mock('http://localhost:3000/api/test', 'GET', JSON.stringify({response:'get'}))
    .mock('http://localhost:3000/api/test', 'DELETE', JSON.stringify({response:'delete'}));
  });

  describe('post()', () => {
    it('should POST to the url and return the response json and the status', (done) => {
      request.post('http://localhost:3000/api/test')
      .then((response) => {
        expect(response.status).toBe(200);
        expect(response.json).toEqual({response:'post'});
        done();
      })
      .catch(done.fail);
    });

    describe('when response is greater than 399', () => {
      it("should throw an error", (done) => {
        backend.reMock('http://localhost:3000/api/test', 'POST', {status:400});

        request.post('http://localhost:3000/api/test')
        .then((response) => {
          done.fail('should have thrown an error');
        })
        .catch((error) => {
          expect(error.status).toBe(400);
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
        expect(response.json).toEqual({response:'get'});
        done();
      })
      .catch(done.fail);
    });

    describe('when response is greater than 399', () => {
      it("should throw an error", (done) => {
        backend.reMock('http://localhost:3000/api/test', 'GET', {status:500});

        request.get('http://localhost:3000/api/test')
        .then((response) => {
          done.fail('should have thrown an error');
        })
        .catch((error) => {
          expect(error.status).toBe(500);
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
        expect(response.json).toEqual({response:'delete'});
        done();
      })
      .catch(done.fail);
    });

    describe('when response is greater than 399', () => {
      it("should throw an error", (done) => {
        backend.reMock('http://localhost:3000/api/test', 'DELETE', {status:404});

        request.delete('http://localhost:3000/api/test')
        .then((response) => {
          done.fail('should have thrown an error');
        })
        .catch((error) => {
          expect(error.status).toBe(404);
          done();
        });
      });
    });

  });

});
