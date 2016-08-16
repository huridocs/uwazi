import search from './search';
import needsAuthorization from '../auth/authMiddleware';

export default (app) => {
  app.get('/api/search/count_by_template', (req, res) => {
    return search.countByTemplate(req.query.templateId)
    .then(results => res.json(results));
  });

  app.get('/api/search', (req, res) => {
    if (req.query.filters) {
      req.query.filters = JSON.parse(req.query.filters);
    }
    if (req.query.types) {
      req.query.types = JSON.parse(req.query.types);
    }
    if (req.query.fields) {
      req.query.fields = JSON.parse(req.query.fields);
    }
    return search.search(req.query)
    .then(results => res.json(results));
  });

  app.get('/api/search/match_title', (req, res) => {
    return search.matchTitle(req.query.searchTerm)
    .then(results => res.json(results));
  });

  app.get('/api/search/unpublished', needsAuthorization, (req, res) => {
    search.getUploadsByUser(req.user)
    .then(response => res.json(response))
    .catch(error => res.json({error: error}));
  });
};
