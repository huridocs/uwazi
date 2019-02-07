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
      semanticSearch.getSearch(req.params.searchId)
      .then(search => res.json(search))
      .catch(next);
    }
  );
};
