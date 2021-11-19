import { Application } from 'express';
import { Suggestions } from 'api/suggestions/suggestions';

export const suggestionsRoutes = (app: Application) => {
  app.get('/api/suggestions/', async (_req, res, _next) => {
    const suggestionsList = await Suggestions.get();
    res.json(suggestionsList);
  });
};
