import pages from './pages';
import needsAuthorization from '../auth/authMiddleware';

export default (app) => {
  app.post('/api/pages', needsAuthorization, (req, res) => {
    return pages.save(req.body, req.user, req.language)
    .then(doc => res.json(doc));
  });

  app.get('/api/pages/list', (req, res) => {
    return pages.list(req.language)
    .then(results => res.json(results));
  });

  app.get('/api/pages', (req, res) => {
    pages.get(req.query.sharedId, req.language)
    .then(response => {
      res.json(response);
    })
    .catch(console.log);
  });

  app.delete('/api/pages', needsAuthorization, (req, res) => {
    pages.delete(req.query.sharedId)
    .then((response) => {
      res.json(response);
    })
    .catch((error) => {
      res.json({error: error.json});
    });
  });
};
