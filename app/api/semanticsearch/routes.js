import semanticSearch from './semanticSearch';

export default (app) => {
  app.post('/api/semantic-search',
    (req, res, next) => {
      semanticSearch.create(req.body, req.language, req.user)
      .then(results => res.json(results))
      .catch(next);
    }
  );
  app.get('/api/semantic-search',
    (req, res, next) => {
      semanticSearch.getAllSearches()
      .then(results => res.json(results))
      .catch(next);
    }
  );
  app.get('/api/semantic-search/:searchId',
    (req, res, next) => {
      semanticSearch.processSearchLimit(req.params.searchId, 10)
      .then(result => res.json(result))
      .catch(next);
    }
  );
  app.get('/api/semantic-search/:searchId/results',
    (req, res, next) => {
      const { searchId } = req.params;
      semanticSearch.getAllDocumentResults(searchId)
      .then(results => res.json(results))
      .catch(next);
    }
  );
};
