import Joi from 'joi';
import templates from './templates';
import settings from 'api/settings';
import { validateRequest } from '../utils';
import needsAuthorization from '../auth/authMiddleware';

export default (app) => {
  app.post('/api/templates',
    needsAuthorization(),
    validateRequest(Joi.object().keys({
      _id: Joi.string(),
      __v: Joi.number(),
      name: Joi.string().required(),
      isEntity: Joi.boolean(),
      properties: Joi.array().required().items(
        Joi.object().keys({
          _id: Joi.string(),
          id: Joi.string(),
          localID: Joi.string(),
          label: Joi.string(),
          name: Joi.string(),
          nestedProperties: Joi.array(),
          type: Joi.string(),
          relationType: Joi.string(),
          filter: Joi.boolean(),
          defaultFilter: Joi.boolean(),
          required: Joi.boolean(),
          sortable: Joi.boolean(),
          showInCard: Joi.boolean(),
          content: Joi.string(),
          prioritySorting: Joi.boolean(),
          inserting: Joi.any()
        })
      ),
      commonProperties: Joi.array().items(
        Joi.object().keys({
          _id: Joi.string(),
          localID: Joi.string(),
          isCommonProperty: Joi.boolean(),
          label: Joi.string(),
          name: Joi.string(),
          prioritySorting: Joi.boolean(),
          type: Joi.string()
        })
      )
    }).required()),
    (req, res) => {
      templates.save(req.body, req.language)
      .then((response) => {
        res.json(response);
        req.io.sockets.emit('templateChange', response);
      })
      .catch(res.error);
    }
  );

  app.get('/api/templates', (req, res) => {
    templates.get()
    .then(response => res.json({ rows: response }))
    .catch(res.error);
  });

  app.delete('/api/templates',
  needsAuthorization(),
  validateRequest(Joi.object({
    _id: Joi.string().required()
  }).required(), 'query'),
    (req, res) => {
      const template = { _id: req.query._id };
      templates.delete(template)
      .then(() => {
        return settings.removeTemplateFromFilters(template._id);
      })
      .then((newSettings) => {
        res.json(template);
        req.io.sockets.emit('updateSettings', newSettings);
        req.io.sockets.emit('templateDelete', template);
      })
      .catch(res.error);
    }
  );

  app.get('/api/templates/count_by_thesauri',
    validateRequest(Joi.object().keys({
      _id: Joi.string().required()
    }).required(), 'query'),
    (req, res) => {
      templates.countByThesauri(req.query._id)
      .then(response => res.json(response))
      .catch(res.error);
    }
  );
};
