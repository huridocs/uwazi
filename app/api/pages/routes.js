import pages from './pages';
import needsAuthorization from '../auth/authMiddleware';

export default (app) => {
  app.post('/api/pages', needsAuthorization(), (req, res, next) => pages.save(req.body, req.user, req.language)
  .then(response => res.json(response))
  .catch(next));

  app.get('/api/pages/list', (req, res, next) => pages.get({ language: req.language })
  .then(response => res.json({ rows: response }))
  .catch(next));

  app.get('/api/pages', (req, res, next) => {
    pages.getById(req.query.sharedId, req.language)
    .then(res.json.bind(res))
    .catch(next);
  });

  app.delete('/api/pages', needsAuthorization(), (req, res, next) => {
    pages.delete(req.query.sharedId)
    .then(response => res.json(response))
    .catch(next);
  });
};
