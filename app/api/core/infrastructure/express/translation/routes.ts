import type { Application, Request } from 'express';

import { validation } from '#api/utils/index.js';
import { SetDefaultLanguageUseCaseFactory } from '#api/core/infrastructure/factories/SetDefaultLanguageUseCaseFactory.js';
import { CSVLoader } from '#api/csv/index.js';
import { uploadMiddleware } from '#api/files/index.js';
import { LanguageISO6391Schema, languageSchema } from '#shared/types/commonSchemas.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { AddLanguageController } from '#api/core/infrastructure/express/language/AddLanguageController.js';
import { DeleteLanguageController } from '#api/core/infrastructure/express/language/DeleteLanguageController.js';
import { AvailableLanguagesQueryServiceFactory } from '#api/core/infrastructure/factories/AvailableLanguagesQueryServiceFactory.js';
import needsAuthorization from '#api/auth/authMiddleware.js';
import { GetTranslationsController } from './GetTranslationsController.js';
import { GetTranslationEntriesController } from './GetTranslationEntriesController.js';
import { PopulateTranslationsController } from './PopulateTranslationsController.js';
import { SaveTranslationsController } from './SaveTranslationsController.js';
import { SaveTranslationEntriesController } from './SaveTranslationEntriesController.js';

type UploadedFileRequest = Request & { file?: Express.Multer.File };
type DeleteTranslationRequest = Request & { query: { key: LanguageISO6391 } };

const translationsRoutes = (app: Application) => {
  app.get(
    '/api/translations',
    validation.validateRequest({
      type: 'object',
      properties: {
        query: {
          type: 'object',
          properties: {
            context: { type: 'string' },
            locale: LanguageISO6391Schema,
          },
        },
      },
    }),
    GetTranslationsController.createHandler()
  );

  app.get('/api/languages', async (_req, res) => {
    res.json(await AvailableLanguagesQueryServiceFactory.default().execute());
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

    async (req: UploadedFileRequest, res, next) => {
      const uploadedFile = req.file;
      if (!uploadedFile) {
        throw new Error('File is not available on request object');
      }
      try {
        const { context } = req.body;
        const loader = new CSVLoader();
        const response = await loader.loadTranslations(uploadedFile.path, context);
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
    SaveTranslationsController.createHandler()
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

    PopulateTranslationsController.createHandler()
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
      const response = await SetDefaultLanguageUseCaseFactory.default().execute({
        key: req.body.key,
      });
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

  app.get('/api/v2/translations', GetTranslationEntriesController.createHandler());

  app.post(
    '/api/v2/translations',
    needsAuthorization(),
    validation.validateRequest({
      type: 'object',
      properties: {
        body: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              language: { type: 'string' },
              key: { type: 'string' },
              value: { type: 'string' },
              context: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  label: { type: 'string' },
                  type: { type: 'string' },
                },
                required: ['id', 'label', 'type'],
              },
            },
            required: ['language', 'key', 'value', 'context'],
          },
        },
      },
      required: ['body'],
    }),
    SaveTranslationEntriesController.createHandler()
  );
};

export { translationsRoutes };
