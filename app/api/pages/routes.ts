import Joi from 'joi';
import { Application, NextFunction, Request, Response } from 'express';

import { PageSchema } from 'shared/types/pageSchema';
import { validation } from 'api/utils';

import needsAuthorization from '../auth/authMiddleware';
import pages from './pages';

export default (app: Application) => {
  app.post(
    '/api/pages',
    needsAuthorization(['admin']),

    validation.validateRequest({
      type: 'object',
      properties: {
        body: PageSchema,
      },
    }),

    (req: Request, res: Response, next: NextFunction) => {
      pages
        .save(req.body, req.user, req.language)
        .then(response => res.json(response))
        .catch(next);
    }
  );

  app.get(
    '/api/pages',

    validation.validateRequest(
      Joi.object()
        .keys({
          sharedId: Joi.string(),
        })
        .required(),
      'query'
    ),

    (req: Request, res: Response, next: NextFunction) => {
      pages
        .get({ ...req.query, language: req.language })
        .then(res.json.bind(res))
        .catch(next);
    }
  );

  app.get(
    '/api/page',

    validation.validateRequest(
      Joi.object()
        .keys({
          sharedId: Joi.string(),
        })
        .required(),
      'query'
    ),

    (req: Request, res: Response, next: NextFunction) => {
      pages
        .getById(req.query.sharedId, req.language)
        .then(res.json.bind(res))
        .catch(next);
    }
  );

  app.delete(
    '/api/pages',
    needsAuthorization(),

    validation.validateRequest(
      Joi.object()
        .keys({
          sharedId: Joi.string(),
        })
        .required(),
      'query'
    ),

    (req: Request, res: Response, next: NextFunction) => {
      pages
        .delete(req.query.sharedId)
        .then(response => res.json(response))
        .catch(next);
    }
  );
};
