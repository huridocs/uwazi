import userRoutes from '../routes.js';
import users from '../users.js';
import instrumentRoutes from 'api/utils/instrumentRoutes';

describe('users routes', () => {
  let routes;

  beforeEach(() => {
    routes = instrumentRoutes(userRoutes);
  });

  describe('POST', () => {
    describe('/users', () => {
      it('should call users update with the body', (done) => {
        spyOn(users, 'update').and.returnValue(Promise.resolve());
        let req = {body: 'changes'};
        routes.post('/api/users', req)
        .then(() => {
          expect(users.update).toHaveBeenCalledWith('changes');
          done();
        })
        .catch(done.fail);
      });
    });

    describe('/recoverpassword', () => {
      it('should call users update with the body email', (done) => {
        spyOn(users, 'recoverPassword').and.returnValue(Promise.resolve());
        let req = {body: {email: 'recover@me.com'}, protocol: 'http', get: () => 'localhost'};
        routes.post('/api/recoverpassword', req)
        .then(() => {
          expect(users.recoverPassword).toHaveBeenCalledWith('recover@me.com', 'http://localhost');
          done();
        })
        .catch(done.fail);
      });
    });

    describe('/resetpassword', () => {
      it('should call users update with the body', (done) => {
        spyOn(users, 'resetPassword').and.returnValue(Promise.resolve());
        let req = {body: 'changes'};
        routes.post('/api/resetpassword', req)
        .then(() => {
          expect(users.resetPassword).toHaveBeenCalledWith('changes');
          done();
        })
        .catch(done.fail);
      });
    });
  });

  describe('GET', () => {
    it('should call users get', (done) => {
      spyOn(users, 'get').and.returnValue(Promise.resolve(['users']));
      let req = {};
      routes.get('/api/users', req)
      .then((res) => {
        expect(users.get).toHaveBeenCalled();
        expect(res).toBe(['users']);
        done();
      })
      .catch(done.fail);
    });
  });
});
