import type { Application, Request } from 'express';

import { createError, validation } from '#api/utils/index.js';
import settings from '#api/settings/index.js';
import { CSVLoader } from '#api/csv/index.js';
import { uploadMiddleware } from '#api/files/index.js';
import { LanguageISO6391Schema, languageSchema } from '#shared/types/commonSchemas.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { UITranslationNotAvailable } from '#api/i18n/defaultTranslations.js';
import { AddLanguageController } from '#api/core/infrastructure/express/language/AddLanguageController.js';
import { DeleteLanguageController } from '#api/core/infrastructure/express/language/DeleteLanguageController.js';
import needsAuthorization from '../auth/authMiddleware.js';
import translations from './translations.js';

type TranslationsRequest = Request & { query: { context: string } };

export default (app: Application) => {
  app.get(
    '/api/translations',
    validation.validateRequest({
      type: 'object',
      properties: {
        query: {
          type: 'object',
          properties: {
            context: { type: 'string' },
          },
        },
      },
    }),
    async (req: TranslationsRequest, res) => {
      const { context } = req.query;
      const response = await translations.get({ context });

      res.json({ rows: response });
    }
  );

  app.get('/api/languages', async (_req, res) => {
    res.json(await translations.availableLanguages());
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
      if (!req.file) throw new Error('File is not available on request object');
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
    validation.validateRequest({
      type: 'object',
      properties: {
        body: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            __v: { type: 'number' },
            locale: { type: 'string' },
            contexts: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  _id: { type: 'string' },
                  id: { type: 'string' },
                  label: { type: 'string' },
                  type: { type: 'string' },
                  values: { type: 'object', additionalProperties: { type: 'string' } },
                },
              },
            },
          },
          required: ['locale', 'contexts'],
        },
      },
      required: ['body'],
    }),

    async (req, res) => {
      const { locale } = await translations.save(req.body);
      const [response] = await translations.get({ locale });
      req.sockets.emitToCurrentTenant('translationsChange', response);
      res.json(response);
    }
  );

  app.post(
    '/api/translations/populate',
    needsAuthorization(),
    validation.validateRequest({
      type: 'object',
      properties: {
        body: {
          type: 'object',
          properties: {
            locale: { type: 'string' },
          },
          required: ['locale'],
        },
      },
      required: ['body'],
    }),

    async (req, res, next) => {
      const { locale } = req.body;
      try {
        await translations.importPredefined(locale);
        res.json(await translations.get({ locale }));
      } catch (error) {
        if (error instanceof UITranslationNotAvailable) {
          next(createError(error, 422));
        }
        next(error);
      }
    }
  );

  app.post(
    '/api/translations/setasdeafult',
    needsAuthorization(),
    validation.validateRequest({
      type: 'object',
      properties: {
        body: {
          type: 'object',
          properties: {
            key: LanguageISO6391Schema,
          },
          required: ['key'],
        },
      },
      required: ['body'],
    }),

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
        body: { type: 'array', items: languageSchema },
      },
    }),

    async (req, res) => {
      await new AddLanguageController({ request: req, response: res }).handleAsync();
    }
  );

  type DeleteTranslationRequest = Request & { query: { key: LanguageISO6391 } };

  app.delete(
    '/api/translations/languages',
    needsAuthorization(),
    validation.validateRequest({
      type: 'object',
      properties: {
        key: LanguageISO6391Schema,
      },
    }),
    async (req: DeleteTranslationRequest, res) => {
      await new DeleteLanguageController({ request: req, response: res }).handleAsync();
    }
  );
};
