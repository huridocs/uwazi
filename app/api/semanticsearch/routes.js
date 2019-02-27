import Joi from 'joi';
import semanticSearch from './semanticSearch';
import { validateRequest } from '../utils';
import needsAuthorization from '../auth/authMiddleware';

export default (app) => {
  app.post('/api/semantic-search',
    needsAuthorization(),
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
    needsAuthorization(),
    (req, res, next) => {
      semanticSearch.getAllSearches()
      .then(results => res.json(results))
      .catch(next);
    }
  );
  app.get('/api/semantic-search/:searchId',
    needsAuthorization(),
    (req, res, next) => {
      semanticSearch.getSearch(req.params.searchId)
      .then(search => res.json(search))
      .catch(next);
    }
  );
  app.delete('/api/semantic-search/:searchId',
    needsAuthorization(),
    (req, res, next) => {
      semanticSearch.deleteSearch(req.params.searchId)
      .then(search => res.json(search))
      .catch(next);
    });
  app.post('/api/semantic-search/:searchId/stop',
    needsAuthorization(),
    (req, res, next) => {
      semanticSearch.stopSearch(req.params.searchId)
      .then(search => res.json(search))
      .catch(next);
    });
  app.post('/api/semantic-search/:searchId/resume',
    needsAuthorization(),
    (req, res, next) => {
      semanticSearch.resumeSearch(req.params.searchId)
      .then(search => res.json(search))
      .catch(next);
    });
};
