import { Application, Request, Response, NextFunction } from 'express';
import { search } from 'api/search';

export default (app: Application) => {
  app.get('/api/search/lookup', (req: Request, res: Response, next: NextFunction) => {
    const { query } = req;
    const templates: [] = query.templates ? JSON.parse(query.templates) : [];
    search
      .autocomplete(query.searchTerm, req.language, templates)
      .then(response => res.json(response))
      .catch(next);
  });

  app.get('/api/search/lookupaggregation', (req: Request, res: Response, next: NextFunction) => {
    const query = JSON.parse(req.query.query);
    search
      .autocompleteAggregations(
        query,
        req.language,
        req.query.property,
        req.query.searchTerm,
        req.user
      )
      .then(response => res.json(response))
      .catch(next);
  });
};
