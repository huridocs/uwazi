import needsAuthorization from '../auth/authMiddleware';
import users from './users';

const getDomain = (req) => req.protocol + '://' + req.get('host');
export default app => {
  app.post('/api/users', needsAuthorization(['admin', 'editor']), (req, res) => {
    users.save(req.body, req.user, getDomain(req))
    .then(response => res.json(response))
    .catch(res.error);
  });

  app.post('/api/users/new', needsAuthorization(), (req, res) => {
    users.newUser(req.body, getDomain(req))
    .then(response => res.json(response))
    .catch(res.error);
  });

  app.post('/api/recoverpassword', (req, res) => {
    users.recoverPassword(req.body.email, getDomain(req))
    .then(() => res.json('OK'))
    .catch(res.error);
  });

  app.post('/api/resetpassword', (req, res) => {
    users.resetPassword(req.body)
    .then(response => res.json(response))
    .catch(res.error);
  });

  app.get('/api/users', needsAuthorization(), (req, res) => {
    users.get()
    .then(response => res.json(response))
    .catch(res.error);
  });

  app.delete('/api/users', needsAuthorization(), (req, res) => {
    users.delete(req.query._id, req.user)
    .then(response => res.json(response))
    .catch(res.error);
  });
};
