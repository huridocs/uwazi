import { Application, Request, Response, NextFunction } from 'express';
// @ts-expect-error TS(2307): Cannot find module '../search.js' or its correspon... Remove this comment to see the full error message
import { search } from '../search.js';
import { OperationalError } from '../common.v2/errors/OperationalError.js';

export default (app: Application) => {
  app.get(
    '/api/search/lookup',
    (
      req: Request<{}, {}, {}, { templates: string | string[]; searchTerm: string }>,
      res: Response,
      next: NextFunction
    ) => {
      const { query } = req;
      const templates: [] = typeof query.templates === 'string' ? JSON.parse(query.templates) : [];
      search
        .autocomplete(query.searchTerm, req.language, templates)
        // @ts-expect-error TS(7006): Parameter 'response' implicitly has an 'any' type.
        .then(response => res.json(response))
        .catch(next);
    }
  );

  app.get(
    '/api/search/lookupaggregation',
    (
      req: Request<{}, {}, {}, { property: string; searchTerm: string; query: string }>,
      res: Response,
      next: NextFunction
    ) => {
      let query;
      try {
        query = JSON.parse(req.query.query);
      } catch (e) {
        throw new OperationalError('Invalid Query', { cause: e });
      }
      search
        .autocompleteAggregations(
          query,
          req.language,
          req.query.property,
          req.query.searchTerm,
          req.user
        )
        // @ts-expect-error TS(7006): Parameter 'response' implicitly has an 'any' type.
        .then(response => res.json(response))
        .catch(next);
    }
  );
};
