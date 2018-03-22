import search from './search';
import entities from 'api/entities';
import needsAuthorization from '../auth/authMiddleware';
export default (app) => {
  app.get('/api/search/count_by_template', (req, res) => {
    return entities.countByTemplate(req.query.templateId)
    .then(results => res.json(results))
    .catch(res.error);
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
    if (req.query.aggregations) {
      req.query.aggregations = JSON.parse(req.query.aggregations);
    }

    return search.search(req.query, req.language, req.user)
    .then(results => res.json(results))
    .catch(res.error);
  });

  app.get('/api/search_snippets', (req, res) => {
    return search.searchSnippets(req.query.searchTerm, req.query.id, req.language)
    .then(results => res.json(results))
    .catch(res.error);
  });

  app.get('/api/search/unpublished', needsAuthorization(['admin', 'editor']), (req, res) => {
    search.getUploadsByUser(req.user, req.language)
    .then(response => res.json({rows: response}))
    .catch(res.error);
  });
};
