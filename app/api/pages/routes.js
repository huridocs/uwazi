import pages from './pages';
import needsAuthorization from '../auth/authMiddleware';

export default (app) => {
  app.post('/api/pages', needsAuthorization(), (req, res) => pages.save(req.body, req.user, req.language)
  .then(response => res.json(response))
  .catch(error => res.json({ error })));

  app.get('/api/pages/list', (req, res) => pages.get({ language: req.language })
  .then(response => res.json({ rows: response }))
  .catch(error => res.json({ error })));

  app.get('/api/pages', (req, res) => {
    pages.getById(req.query.sharedId, req.language)
    .then(res.json.bind(res))
    .catch(res.error.bind(res));
  });

  app.delete('/api/pages', needsAuthorization(), (req, res) => {
    pages.delete(req.query.sharedId)
    .then(response => res.json(response))
    .catch(error => res.json({ error }));
  });
};
