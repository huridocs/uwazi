import userRoutes from '../routes.js';
import users from '../users.js';
import instrumentRoutes from 'api/utils/instrumentRoutes';



describe('users routes', () => {
  let routes;

  beforeEach(() => {
    routes = instrumentRoutes(userRoutes);
  });

  describe('POST /users', () => {
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

  describe('POST /recoverpassword', () => {
    it('should call users update with the body email', (done) => {
      spyOn(users, 'recoverPassword').and.returnValue(Promise.resolve());
      let req = {body: {email: 'recover@me.com'}};
      routes.post('/api/recoverpassword', req)
      .then(() => {
        expect(users.recoverPassword).toHaveBeenCalledWith('recover@me.com');
        done();
      })
      .catch(done.fail);
    });
  });

  describe('POST /resetpassword', () => {
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
