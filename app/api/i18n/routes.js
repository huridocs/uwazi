/** @format */

import Joi from 'joi';

import { validation } from 'api/utils';
import settings from 'api/settings';
import entities from 'api/entities';
import pages from 'api/pages';

import needsAuthorization from '../auth/authMiddleware';
import translations from './translations';

export default app => {
  app.get('/api/translations', (_req, res, next) => {
    translations
      .get()
      .then(response => res.json({ rows: response }))
      .catch(next);
  });

  app.post(
    '/api/translations',

    needsAuthorization(),

    validation.validateRequest(
      Joi.object()
        .keys({
          _id: Joi.objectId(),
          __v: Joi.number(),
          locale: Joi.string().required(),
          contexts: Joi.array()
            .required()
            .items(
              Joi.object().keys({
                _id: Joi.string(),
                id: Joi.string(),
                label: Joi.string(),
                type: Joi.string(),
                values: Joi.object().pattern(/\w+/, Joi.string()),
              })
            ),
        })
        .required()
    ),

    (req, res, next) => {
      translations
        .save(req.body)
        .then(response => {
          response.contexts = translations.prepareContexts(response.contexts);
          req.io.emitToCurrentTenant('translationsChange', response);
          res.json(response);
        })
        .catch(next);
    }
  );

  app.post(
    '/api/translations/setasdeafult',
    needsAuthorization(),
    validation.validateRequest(
      Joi.object()
        .keys({
          key: Joi.string(),
        })
        .required()
    ),

    (req, res, next) => {
      settings
        .setDefaultLanguage(req.body.key)
        .then(response => {
          req.io.emitToCurrentTenant('updateSettings', response);
          res.json(response);
        })
        .catch(next);
    }
  );

  app.post(
    '/api/translations/languages',
    needsAuthorization(),
    validation.validateRequest(
      Joi.object()
        .keys({
          key: Joi.string(),
          label: Joi.string(),
          rtl: Joi.boolean(),
        })
        .required()
    ),

    async (req, res, next) => {
      try {
        const newSettings = await settings.addLanguage(req.body);
        const newTranslations = await translations.addLanguage(req.body.key);
        await entities.addLanguage(req.body.key);
        await pages.addLanguage(req.body.key);

        req.io.emitToCurrentTenant('updateSettings', newSettings);
        req.io.emitToCurrentTenant('translationsChange', newTranslations);
        res.json(newSettings);
      } catch (e) {
        next(e);
      }
    }
  );

  app.delete(
    '/api/translations/languages',
    needsAuthorization(),
    validation.validateRequest(
      Joi.object()
        .keys({
          key: Joi.string(),
        })
        .required()
    ),

    (req, res, next) => {
      Promise.all([
        settings.deleteLanguage(req.query.key),
        translations.removeLanguage(req.query.key),
        entities.removeLanguage(req.query.key),
        pages.removeLanguage(req.query.key),
      ])
        .then(([newSettings, newTranslations]) => {
          req.io.emitToCurrentTenant('updateSettings', newSettings);
          req.io.emitToCurrentTenant('translationsChange', newTranslations);
          res.json(newSettings);
        })
        .catch(next);
    }
  );
};
