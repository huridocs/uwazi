import settings from 'api/settings/settings';
import dictionaries from 'api/settings/dictionaries';
import needsAuthorization from '../auth/authMiddleware';

export default app => {
  app.post('/api/settings', needsAuthorization, (req, res) => {
    settings.save(req.body)
    .then((response) => res.json(response));
  });

  app.get('/api/settings', (req, res) => {
    settings.get()
    .then((response) => res.json(response))
    .catch((e) => {
      console.trace(e);
    });
  });

  app.get('/api/settings/dictionaries', (req, res) => {
    dictionaries.get()
    .then((response) => res.json(response))
    .catch((e) => {
      console.trace(e);
    });
  });
};
