import Joi from 'joi';
import semanticSearch from './semanticSearch';
import { validateRequest } from '../utils';

export default (app) => {
  app.post('/api/semantic-search',
    validateRequest(Joi.object().keys({
      searchTerm: Joi.string().required(),
      documents: Joi.array().items(Joi.string()),
      query: Joi.object()
    }).required()),
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
  app.delete('/api/semantic-search/:searchId',
    (req, res, next) => {
      semanticSearch.deleteSearch(req.params.searchId)
      .then(search => res.json(search))
      .catch(next);
    });
};
