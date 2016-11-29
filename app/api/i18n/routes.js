import translations from './translations';
import needsAuthorization from '../auth/authMiddleware';

export default app => {
  app.get('/api/translations', (req, res) => {
    translations.get()
    .then((response) => res.json(response))
    .catch((e) => {
      console.trace(e);
    });
  });

  app.post('/api/translations', needsAuthorization, (req, res) => {
    translations.save(req.body)
    .then((response) => res.json(response))
    .catch((e) => {
      console.trace(e);
    });
  });

  app.post('/api/translations/addEntries', needsAuthorization, (req, res) => {
    translations.addEntries(req.body)
    .then((response) => res.json(response))
    .catch((e) => {
      console.trace(e);
    });
  });

  app.post('/api/translations/addentry', needsAuthorization, (req, res) => {
    translations.addEntry(req.body.context, req.body.key, req.body.value)
    .then((response) => res.json(response))
    .catch((e) => {
      console.trace(e);
    });
  });
};
