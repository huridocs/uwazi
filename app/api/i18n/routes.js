import Joi from 'joi';

import { validateRequest } from 'api/utils';

import needsAuthorization from '../auth/authMiddleware';
import translations from './translations';

export default (app) => {
  app.get('/api/translations', (req, res, next) => {
    translations.get()
    .then(response => res.json({ rows: response }))
    .catch(next);
  });

  app.post(
    '/api/translations',

    needsAuthorization(),

    validateRequest(Joi.object().keys({
      _id: Joi.string(),
      __v: Joi.number(),
      locale: Joi.string().required(),
      contexts: Joi.array().required().items(
        Joi.object().keys({
          _id: Joi.string(),
          id: Joi.string(),
          label: Joi.string(),
          type: Joi.string(),
          values: Joi.object().pattern(/\w+/, Joi.string()),
        })
      ),
    }).required()),

    (req, res, next) => {
      translations.save(req.body)
      .then((response) => {
        response.contexts = translations.prepareContexts(response.contexts);
        req.io.sockets.emit('translationsChange', response);
        res.json(response);
      })
      .catch(next);
    });

  // app.post(
  //   '/api/translations/addentry',

  //   needsAuthorization(),

  //   validateRequest(Joi.object().keys({
  //     context: Joi.string().required(),
  //     key: Joi.string().required(),
  //     value: Joi.string().required(),
  //   }).required()),

  //   (req, res, next) => {
  //     translations.addEntry(req.body.context, req.body.key, req.body.value)
  //     .then(response => res.json(response))
  //     .catch(next);
  //   }
  // );
};
