"use strict";var _jasmineHelpers = require("../../utils/jasmineHelpers");
var _instrumentRoutes = _interopRequireDefault(require("../../utils/instrumentRoutes"));

var _routes = _interopRequireDefault(require("../routes.js"));
var _users = _interopRequireDefault(require("../users.js"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('users routes', () => {
  let routes;

  beforeEach(() => {
    routes = (0, _instrumentRoutes.default)(_routes.default);
  });

  describe('POST', () => {
    describe('/users', () => {
      it('should have a validation schema', () => {
        expect(routes.post.validation('/api/users')).toMatchSnapshot();
      });

      it('should call users save with the body', done => {
        spyOn(_users.default, 'save').and.returnValue(Promise.resolve());
        const req = { body: 'changes', user: { _id: 'currentUser' }, protocol: 'http', get: () => 'localhost' };
        routes.post('/api/users', req).
        then(() => {
          expect(_users.default.save).toHaveBeenCalledWith('changes', { _id: 'currentUser' }, 'http://localhost');
          done();
        }).
        catch((0, _jasmineHelpers.catchErrors)(done));
      });
    });

    describe('/users/new', () => {
      it('should have a validation schema', () => {
        expect(routes.post.validation('/api/users/new')).toMatchSnapshot();
      });

      it('should call users newUser with the body', done => {
        spyOn(_users.default, 'newUser').and.returnValue(Promise.resolve());
        const req = { body: 'changes', user: { _id: 'currentUser' }, protocol: 'http', get: () => 'localhost' };
        routes.post('/api/users/new', req).
        then(() => {
          expect(_users.default.newUser).toHaveBeenCalledWith('changes', 'http://localhost');
          done();
        }).
        catch((0, _jasmineHelpers.catchErrors)(done));
      });
    });

    describe('/recoverpassword', () => {
      it('should have a validation schema', () => {
        expect(routes.post.validation('/api/recoverpassword')).toMatchSnapshot();
      });

      it('should call users update with the body email', done => {
        spyOn(_users.default, 'recoverPassword').and.returnValue(Promise.resolve());
        const req = { body: { email: 'recover@me.com' }, protocol: 'http', get: () => 'localhost' };
        routes.post('/api/recoverpassword', req).
        then(response => {
          expect(response).toBe('OK');
          expect(_users.default.recoverPassword).toHaveBeenCalledWith('recover@me.com', 'http://localhost');
          done();
        }).
        catch((0, _jasmineHelpers.catchErrors)(done));
      });

      it('should return an error if recover password fails', async () => {
        spyOn(_users.default, 'recoverPassword').and.returnValue(Promise.reject(new Error('error')));
        const req = { body: { email: 'recover@me.com' }, protocol: 'http', get: () => 'localhost' };

        try {
          await routes.post('/api/recoverpassword', req);
        } catch (error) {
          expect(error).toEqual(new Error('error'));
        }
      });
    });

    describe('/resetpassword', () => {
      it('should have a validation schema', () => {
        expect(routes.post.validation('/api/resetpassword')).toMatchSnapshot();
      });

      it('should call users update with the body', done => {
        spyOn(_users.default, 'resetPassword').and.returnValue(Promise.resolve());
        const req = { body: 'changes' };
        routes.post('/api/resetpassword', req).
        then(() => {
          expect(_users.default.resetPassword).toHaveBeenCalledWith('changes');
          done();
        }).
        catch((0, _jasmineHelpers.catchErrors)(done));
      });
    });

    describe('/unlockaccount', () => {
      it('should have a validation schema', () => {
        expect(routes.post.validation('/api/unlockaccount')).toMatchSnapshot();
      });

      it('should call users.unlockAccount with the body', done => {
        jest.spyOn(_users.default, 'unlockAccount').mockResolvedValue();
        const req = { body: 'credentials' };
        routes.post('/api/unlockaccount', req).
        then(() => {
          expect(_users.default.unlockAccount).toHaveBeenCalledWith('credentials');
          done();
        }).
        catch((0, _jasmineHelpers.catchErrors)(done));
      });
    });
  });

  describe('GET', () => {
    it('should need authorization', () => {
      const req = {};
      expect(routes.get('/api/users', req)).toNeedAuthorization();
    });

    it('should call users get', done => {
      spyOn(_users.default, 'get').and.returnValue(Promise.resolve(['users']));
      const req = {};
      routes.get('/api/users', req).
      then(res => {
        expect(_users.default.get).toHaveBeenCalled();
        expect(res).toEqual(['users']);
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });

    it('should call next on error', async () => {
      spyOn(_users.default, 'recoverPassword').and.returnValue(Promise.reject(new Error('error')));
      const req = { body: { email: 'recover@me.com' }, protocol: 'http', get: () => 'localhost' };

      try {
        await routes.post('/api/recoverpassword', req);
      } catch (error) {
        expect(error).toEqual(new Error('error'));
      }
    });
  });

  describe('DELETE', () => {
    let req;
    beforeEach(() => {
      req = { query: { _id: 123, username: 'Nooooooo!' }, user: { _id: 'currentUser' } };
      spyOn(_users.default, 'delete').and.returnValue(Promise.resolve({ json: 'ok' }));
    });

    it('should have a validation schema', () => {
      expect(routes.delete.validation('/api/users')).toMatchSnapshot();
    });

    it('should need authorization', () => {
      expect(routes.delete('/api/users', req)).toNeedAuthorization();
    });

    it('should use users to delete it', done => {
      routes.delete('/api/users', req).
      then(() => {
        expect(_users.default.delete).toHaveBeenCalledWith(req.query._id, { _id: 'currentUser' });
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });
  });
});