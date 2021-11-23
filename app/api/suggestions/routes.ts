import { Application } from 'express';
import { Suggestions } from 'api/suggestions/suggestions';
import { InformationExtraction } from 'api/services/informationextraction/InformationExtraction';

const IX = new InformationExtraction();

export const suggestionsRoutes = (app: Application) => {
  app.get('/api/suggestions/', async (req, res, _next) => {
    const suggestionsList = await Suggestions.get(
      { propertyName: req.query.propertyName, language: req.language },
      { page: 2, size: 2 }
    );
    res.json(suggestionsList);
  });

  app.post('/api/suggestions/train', async (req, res, _next) => {
    await IX.trainAllModels();
    res.json({});
  });
};
