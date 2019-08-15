import Joi from 'joi';
import semanticSearch from './semanticSearch';
import { validation } from '../utils';
import handleError from '../utils/handleError';
import needsAuthorization from '../auth/authMiddleware';
import workers from './workerManager';
import updateNotifier from './updateNotifier';


workers.on('searchError', (searchId, error) => {
  handleError(error);
});

export default (app) => {
  app.post('/api/semantic-search',
    needsAuthorization(),
    validation.validateRequest(Joi.object().keys({
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
    validation.validateRequest(Joi.object().keys({
      limit: Joi.number().min(0),
      skip: Joi.number().min(0),
      threshold: Joi.number().min(0),
      minRelevantSentences: Joi.number().min(0)
    }), 'query'),
    (req, res, next) => {
      const args = {
        limit: Number(req.query.limit || 30),
        skip: Number(req.query.skip || 0),
        threshold: Number(req.query.threshold || 0.4),
        minRelevantSentences: Number(req.query.minRelevantSentences || 5)
      };
      semanticSearch.getSearch(req.params.searchId, args)
      .then(search => res.json(search))
      .catch(next);
    }
  );
  app.get('/api/semantic-search/:searchId/list',
    needsAuthorization(),
    validation.validateRequest(Joi.object().keys({
      threshold: Joi.number().min(0).required(),
      minRelevantSentences: Joi.number().min(0).required()
    }), 'query'),
    (req, res, next) => {
      const args = {
        ...req.query,
        threshold: Number(req.query.threshold),
        minRelevantSentences: Number(req.query.minRelevantSentences)
      };
      semanticSearch.listSearchResultsDocs(req.params.searchId, args)
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
  app.get('/api/semantic-search/by-document/:sharedId',
    needsAuthorization(),
    (req, res, next) => {
      semanticSearch.getSearchesByDocument(req.params.sharedId)
      .then(searches => res.json(searches))
      .catch(next);
    });
  app.post('/api/semantic-search/notify-updates',
    needsAuthorization(),
    (req, res) => {
      updateNotifier.addRequest(req);
      res.json({ ok: true });
    });
};

workers.on('searchUpdated',
  async (searchId, updates) => updateNotifier.notifySearchUpdate(searchId, updates));
