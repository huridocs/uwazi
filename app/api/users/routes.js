import needsAuthorization from '../auth/authMiddleware';
import Users from './Users';

export default app => {
  app.post('/api/users', needsAuthorization, (req, res) => {
    Users.update(req.body)
    .then(() => {
      res.json('ok');
    });
  });
};
