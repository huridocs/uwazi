import settings from 'api/settings/settings';
import needsAuthorization from '../auth/authMiddleware';

export default app => {
  app.post('/api/settings', needsAuthorization, (req, res) => {
    settings.save(req.body)
    .then(response => res.json(response))
    .catch(res.error);
  });

  app.get('/api/settings', (req, res) => {
    settings.get()
    .then((response) => res.json(response))
    .catch(res.error);
  });
};
