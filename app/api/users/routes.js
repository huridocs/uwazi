import needsAuthorization from '../auth/authMiddleware';
import users from './users';

export default app => {
  app.post('/api/users', needsAuthorization, (req, res) => {
    users.update(req.body)
    .then(() => {
      res.json('ok');
    });
  });

  app.post('/api/recoverpassword', (req, res) => {
    users.recoverPassword(req.body.email)
    .then(() => {
      res.json('ok');
    });
  });

  app.post('/api/resetpassword', (req, res) => {
    users.resetPassword(req.body)
    .then(() => {
      res.json('ok');
    });
  });
};
