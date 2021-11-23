import { Application } from 'express';
import { Suggestions } from 'api/suggestions/suggestions';

export const suggestionsRoutes = (app: Application) => {
  app.get('/api/suggestions/', async (req, res, _next) => {
    const suggestionsList = await Suggestions.get(
      { propertyName: req.query.propertyName, language: req.language },
      { page: 2, size: 2 }
    );
    res.json(suggestionsList);
  });
};
