"use strict";var _fetchMock = _interopRequireDefault(require("fetch-mock"));

var _JSONRequest = _interopRequireDefault(require("../JSONRequest"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('JSONRequest', () => {
  beforeEach(() => {
    _fetchMock.default.restore();
    _fetchMock.default.
    post('http://localhost:3000/api/test', JSON.stringify({ response: 'post' })).
    put('http://localhost:3000/api/test', JSON.stringify({ response: 'put' })).
    get('http://localhost:3000/api/test', JSON.stringify({ response: 'get' })).
    get('http://localhost:3000/api/withParams?param1=param1&param2=%7B%22value%22%3A2%7D', JSON.stringify({ response: 'get with params' })).
    get('http://localhost:3000/api/withParams?param1=param1&param2=%7B%22value%22%3A2%7D&q=(order:desc,sort:creationDate)',
    JSON.stringify({ response: 'get with params and rison "q"' })).
    get('http://localhost:3000/api/withParams?param1=param1&param2=%7B%22value%22%3A2%7D&q=%7Bunable%3A%20%22to%20decode%22%7D',
    JSON.stringify({ response: 'get with params and undecodable q' })).
    delete('http://localhost:3000/api/test', JSON.stringify({ response: 'delete' })).
    delete('http://localhost:3000/api/test?id=123', JSON.stringify({ response: 'delete with params' }));
  });

  describe('post()', () => {
    describe('set-cookie', () => {
      it('should return the set-cookie param when set', async () => {
        _fetchMock.default.restore();
        _fetchMock.default.post('http://localhost:3000/api/test', { body: JSON.stringify({ response: 'post' }), headers: { 'set-cookie': 'cookie' } });
        const response = await _JSONRequest.default.post('http://localhost:3000/api/test');
        expect(response.cookie).toEqual('cookie');
      });
    });

    it('should POST to the url and return the response json and the status', done => {
      _JSONRequest.default.post('http://localhost:3000/api/test').
      then(response => {
        expect(response.status).toBe(200);
        expect(response.json).toEqual({ response: 'post' });
        done();
      }).
      catch(done.fail);
    });

    describe('when response is greater than 399', () => {
      it('should throw an error', done => {
        _fetchMock.default.restore().post('http://localhost:3000/api/test', { status: 400, body: JSON.stringify({ error: 'error!' }) });

        _JSONRequest.default.post('http://localhost:3000/api/test').
        then(() => {
          done.fail('should have thrown an error');
        }).
        catch(response => {
          expect(response.json.error).toBe('error!');
          expect(response.status).toBe(400);
          done();
        });
      });
    });

    describe('when passing headers', () => {
      it('should send them (with some default headers)', done => {
        _JSONRequest.default.post('http://localhost:3000/api/test', {}, { Cookie: 'cookie' }).
        then(() => {
          const { headers } = _fetchMock.default.calls()[0][1];
          expect(headers.Cookie).toBe('cookie');
          expect(headers['X-Requested-With']).toBe('XMLHttpRequest');
          done();
        }).
        catch(done.fail);
      });
    });

    describe('when authorizing', () => {
      it('should send the authorization cookie in the headers', async () => {
        _JSONRequest.default.cookie('cookie');
        await _JSONRequest.default.get('http://localhost:3000/api/test');
        const { headers } = _fetchMock.default.calls()[0][1];
        expect(headers.Cookie).toBe('cookie');
      });
    });
  });

  describe('put()', () => {
    it('should PUT to the url and return the response json and the status', done => {
      _JSONRequest.default.put('http://localhost:3000/api/test').
      then(response => {
        expect(response.status).toBe(200);
        expect(response.json).toEqual({ response: 'put' });
        done();
      }).
      catch(done.fail);
    });

    describe('when response is greater than 399', () => {
      it('should throw an error', done => {
        _fetchMock.default.restore().put('http://localhost:3000/api/test', { status: 400, body: JSON.stringify({ error: 'error!' }) });

        _JSONRequest.default.put('http://localhost:3000/api/test').
        then(() => {
          done.fail('should have thrown an error');
        }).
        catch(response => {
          expect(response.json.error).toBe('error!');
          expect(response.status).toBe(400);
          done();
        });
      });
    });

    describe('when passing headers', () => {
      it('should send them', done => {
        _JSONRequest.default.put('http://localhost:3000/api/test', {}, { Cookie: 'cookie' }).
        then(() => {
          const { headers } = _fetchMock.default.calls()[0][1];
          expect(headers.Cookie).toBe('cookie');

          done();
        }).
        catch(done.fail);
      });
    });
  });

  describe('get()', () => {
    it('should GET to the url and return the response json and the status', done => {
      _JSONRequest.default.get('http://localhost:3000/api/test').
      then(response => {
        expect(response.status).toBe(200);
        expect(response.json).toEqual({ response: 'get' });
        done();
      }).
      catch(done.fail);
    });

    describe('when passing data', () => {
      it('should transform it to url params and not send a body', done => {
        let undefinedVar;
        _JSONRequest.default.get('http://localhost:3000/api/withParams', { param1: 'param1', param2: { value: 2 }, paramNull: null, paramUndefined: undefinedVar }).
        then(response => {
          expect(response.status).toBe(200);
          expect(response.json).toEqual({ response: 'get with params' });
          expect(_fetchMock.default.lastOptions().body).not.toBeDefined();
          done();
        }).
        catch(done.fail);
      });
    });

    describe('when passing rison encoded data', () => {
      it('should transform only non rison (q) params and not send a body', done => {
        _JSONRequest.default.get('http://localhost:3000/api/withParams', { param1: 'param1', param2: { value: 2 }, q: '(order:desc,sort:creationDate)' }).
        then(response => {
          expect(response.status).toBe(200);
          expect(response.json).toEqual({ response: 'get with params and rison "q"' });
          expect(_fetchMock.default.lastOptions().body).not.toBeDefined();
          done();
        }).
        catch(done.fail);
      });

      it('should transform q if its content is not able to be rison decoded', done => {
        _JSONRequest.default.get('http://localhost:3000/api/withParams', { param1: 'param1', param2: { value: 2 }, q: '{unable: "to decode"}' }).
        then(response => {
          expect(response.status).toBe(200);
          expect(response.json).toEqual({ response: 'get with params and undecodable q' });
          expect(_fetchMock.default.lastOptions().body).not.toBeDefined();
          done();
        }).
        catch(done.fail);
      });
    });

    describe('when passing headers', () => {
      it('should send them', done => {
        _JSONRequest.default.get('http://localhost:3000/api/test', {}, { Cookie: 'cookie' }).
        then(() => {
          const { headers } = _fetchMock.default.calls()[0][1];
          expect(headers.Cookie).toBe('cookie');

          done();
        }).
        catch(done.fail);
      });
    });

    describe('when response is greater than 399', () => {
      it('should throw an error', done => {
        _fetchMock.default.restore().get('http://localhost:3000/api/test', { status: 500, body: JSON.stringify({ error: 'error!' }) });

        _JSONRequest.default.get('http://localhost:3000/api/test').
        then(() => {
          done.fail('should have thrown an error');
        }).
        catch(response => {
          expect(response.json.error).toBe('error!');
          expect(response.status).toBe(500);
          done();
        });
      });
    });
  });

  describe('delete()', () => {
    describe('when passing headers', () => {
      it('should send them', done => {
        _JSONRequest.default.delete('http://localhost:3000/api/test', {}, { Cookie: 'cookie' }).
        then(() => {
          const { headers } = _fetchMock.default.calls()[0][1];
          expect(headers.Cookie).toBe('cookie');

          done();
        }).
        catch(done.fail);
      });
    });

    it('should DELETE to the url and return the response json and the status', done => {
      _JSONRequest.default.delete('http://localhost:3000/api/test').
      then(response => {
        expect(response.status).toBe(200);
        expect(response.json).toEqual({ response: 'delete' });
        done();
      }).
      catch(done.fail);
    });

    describe('when passing data', () => {
      it('should send it in params', done => {
        _JSONRequest.default.delete('http://localhost:3000/api/test', { id: '123' }).
        then(response => {
          expect(response.status).toBe(200);
          expect(response.json).toEqual({ response: 'delete with params' });
          done();
        }).
        catch(done.fail);
      });
    });

    describe('when response is greater than 399', () => {
      it('should throw an error', done => {
        _fetchMock.default.restore().delete('http://localhost:3000/api/test', { status: 404, body: JSON.stringify({ error: 'error!' }) });

        _JSONRequest.default.delete('http://localhost:3000/api/test').
        then(() => {
          done.fail('should have thrown an error');
        }).
        catch(response => {
          expect(response.status).toBe(404);
          expect(response.json.error).toBe('error!');
          done();
        });
      });
    });
  });
});