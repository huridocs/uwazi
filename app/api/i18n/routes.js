import Joi from 'joi';

import { validateRequest } from 'api/utils';
import settings from 'api/settings';
import entities from 'api/entities';
import pages from 'api/pages';

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

    validateRequest(Joi.object()
    .keys({
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
    }
  );

  app.post(
    '/api/translations/setasdeafult',
    needsAuthorization(),
    validateRequest(Joi.object().keys({
      key: Joi.string(),
    }).required()),

    (req, res, next) => {
      settings.setDefaultLanguage(req.body.key)
      .then((response) => {
        req.io.sockets.emit('updateSettings', response);
        res.json(response);
      })
      .catch(next);
    }
  );

  app.post(
    '/api/translations/languages',
    needsAuthorization(),
    validateRequest(Joi.object().keys({
      key: Joi.string(),
      label: Joi.string(),
    }).required()),

    (req, res, next) => {
      Promise.all([
        settings.addLanguage(req.body),
        translations.addLanguage(req.body.key),
        entities.addLanguage(req.body.key),
        pages.addLanguage(req.body.key),
      ])
      .then(([newSettings, newTranslations]) => {
        req.io.sockets.emit('updateSettings', newSettings);
        req.io.sockets.emit('translationsChange', newTranslations);
        res.json(newSettings);
      })
      .catch(next);
    }
  );

  app.delete(
    '/api/translations/languages',
    needsAuthorization(),
    validateRequest(Joi.object().keys({
      key: Joi.string(),
    }).required()),

    (req, res, next) => {
      Promise.all([
        settings.deleteLanguage(req.query.key),
        translations.removeLanguage(req.query.key),
        entities.removeLanguage(req.query.key),
        pages.removeLanguage(req.query.key),
      ])
      .then(([newSettings, newTranslations]) => {
        req.io.sockets.emit('updateSettings', newSettings);
        req.io.sockets.emit('translationsChange', newTranslations);
        res.json(newSettings);
      })
      .catch(next);
    }
  );
};
