import translations from './translations';
import needsAuthorization from '../auth/authMiddleware';

export default app => {
  app.get('/api/i18n/translations', (req, res) => {
    translations.get()
    .then((response) => res.json(response))
    .catch((e) => {
      console.trace(e);
    });
  });

  app.post('/api/i18n/translations', needsAuthorization, (req, res) => {
    translations.save(req.body)
    .then((response) => res.json(response))
    .catch((e) => {
      console.trace(e);
    });
  });
};
