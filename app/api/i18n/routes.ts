import Joi from 'joi';
import { validation } from 'api/utils';
import settings from 'api/settings';
import entities from 'api/entities';
import pages from 'api/pages';
import { CSVLoader } from 'api/csv';
import { uploadMiddleware } from 'api/files';
import { languageSchema } from 'shared/types/commonSchemas';
import { availableLanguages } from 'shared/languagesList';
import { Application, Request } from 'express';
import { GithubQuotaExceeded } from 'api/i18n/contentsClient';
import needsAuthorization from '../auth/authMiddleware';
import translations from './translations';

export default (app: Application) => {
  app.get('/api/translations', async (_req, res) => {
    const response = await translations.get();

    res.json({ rows: response });
  });

  app.get('/api/languages', (_req, res) => {
    res.json(availableLanguages);
  });

  app.post(
    '/api/translations/import',
    needsAuthorization(),
    uploadMiddleware(),
    validation.validateRequest({
      type: 'object',
      properties: {
        body: {
          type: 'object',
          properties: {
            context: { type: 'string' },
          },
          required: ['context'],
        },
      },
    }),

    async (req, res, next) => {
      try {
        const { context } = req.body;
        const loader = new CSVLoader();
        const response = await loader.loadTranslations(req.file.path, context);
        response.forEach(translation => {
          req.sockets.emitToCurrentTenant('translationsChange', translation);
        });
        res.json(response);
      } catch (e) {
        next(e);
      }
    }
  );

  app.post(
    '/api/translations',
    needsAuthorization(),
    validation.validateRequest(
      Joi.object()
        .keys({
          _id: Joi.string(),
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
                values: Joi.object().pattern(Joi.string(), Joi.string()),
              })
            ),
        })
        .required()
    ),

    async (req, res) => {
      const { _id } = await translations.save(req.body);
      const [response] = await translations.get({ _id });
      req.sockets.emitToCurrentTenant('translationsChange', response);
      res.json(response);
    }
  );

  app.post(
    '/api/translations/populate',
    needsAuthorization(),
    validation.validateRequest(
      Joi.object()
        .keys({
          locale: Joi.string(),
        })
        .required()
    ),

    async (req, res, next) => {
      const { locale } = req.body;
      try {
        await translations.importPredefined(locale);
        res.json(await translations.get({ locale }));
      } catch (error) {
        if (error instanceof GithubQuotaExceeded) {
          res.status(503);
          res.json({ error: error.message });
          return;
        }
        next(error);
      }
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

    async (req, res) => {
      const response = await settings.setDefaultLanguage(req.body.key);
      req.sockets.emitToCurrentTenant('updateSettings', response);
      res.json(response);
    }
  );

  app.post(
    '/api/translations/languages',
    needsAuthorization(),
    validation.validateRequest({
      type: 'object',
      properties: {
        body: languageSchema,
      },
    }),

    async (req, res) => {
      const newSettings = await settings.addLanguage(req.body);
      const newTranslations = await translations.addLanguage(req.body.key);
      await entities.addLanguage(req.body.key);
      await pages.addLanguage(req.body.key);

      req.sockets.emitToCurrentTenant('updateSettings', newSettings);
      req.sockets.emitToCurrentTenant('translationsChange', newTranslations);
      res.json(newSettings);
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

    async (req: Request<{}, {}, {}, { key: string }>, res) => {
      const [newSettings, newTranslations] = await Promise.all([
        settings.deleteLanguage(req.query.key),
        translations.removeLanguage(req.query.key),
        entities.removeLanguage(req.query.key),
        pages.removeLanguage(req.query.key),
      ]);

      req.sockets.emitToCurrentTenant('updateSettings', newSettings);
      req.sockets.emitToCurrentTenant('translationsChange', newTranslations);
      res.json(newSettings);
    }
  );
};
