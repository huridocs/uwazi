import needsAuthorization from '../auth/authMiddleware';
import users from './users';

export default app => {
  app.post('/api/users', needsAuthorization, (req, res) => {
    users.update(req.body)
    .then(response => res.json(response))
    .catch(error => res.json({error}));
  });

  app.post('/api/recoverpassword', (req, res) => {
    let domain = req.protocol + '://' + req.get('host');
    users.recoverPassword(req.body.email, domain)
    .then(response => res.json(response))
    .catch(error => res.json({error}));
  });

  app.post('/api/resetpassword', (req, res) => {
    users.resetPassword(req.body)
    .then(response => res.json(response))
    .catch(error => res.json({error}));
  });
};
