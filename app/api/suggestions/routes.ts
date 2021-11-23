import { Application } from 'express';
import { Suggestions } from 'api/suggestions/suggestions';
import { InformationExtraction } from 'api/services/informationextraction/InformationExtraction';
import { parseQuery } from 'api/utils/parseQueryMiddleware';

const IX = new InformationExtraction();

export const suggestionsRoutes = (app: Application) => {
  app.get('/api/suggestions/', parseQuery, async (req, res, _next) => {
    const options: { page: number; size: number } | undefined = req.query.page
      ? { page: req.query.page, size: req.query.size }
      : undefined;
    const suggestionsList = await Suggestions.get(
      { propertyName: req.query.propertyName, language: req.language },
      options
    );
    res.json(suggestionsList);
  });

  app.post('/api/suggestions/train', async (_req, res, _next) => {
    await IX.trainAllModels();
    res.json({});
  });
};
