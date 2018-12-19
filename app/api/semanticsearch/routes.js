import semanticSearch from './semanticSearch';

export default (app) => {
  app.post('/api/semantic-search',
    (req, res, next) => {
      return semanticSearch.create(req.body, req.language, req.user)
      .then(results => res.json(results))
      .catch(next);
    }
  );
};
