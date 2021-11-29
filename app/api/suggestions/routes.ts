import { Application } from 'express';
import { Suggestions } from 'api/suggestions/suggestions';
import { InformationExtraction } from 'api/services/informationextraction/InformationExtraction';
import { parseQuery } from 'api/utils/parseQueryMiddleware';
import { validateAndCoerceRequest } from 'api/utils/validateRequest';
import { needsAuthorization } from 'api/auth';
import { IXSuggestionsQuerySchema } from 'shared/types/suggestionSchema';

const IX = new InformationExtraction();

export const suggestionsRoutes = (app: Application) => {
  app.get(
    '/api/suggestions/',
    needsAuthorization(['admin']),
    parseQuery,
    validateAndCoerceRequest({
      properties: {
        query: IXSuggestionsQuerySchema,
      },
    }),
    async (req, res, _next) => {
      const suggestionsList = await Suggestions.get(
        { language: req.language, ...req.query.filter },
        { page: req.query.page }
      );
      res.json(suggestionsList);
    }
  );

  app.post('/api/suggestions/train', async (_req, res, _next) => {
    await IX.trainAllModels();
    res.json({});
  });
};
