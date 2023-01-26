import { Application, Request } from 'express';
import Joi from 'joi';

import { paths } from 'api/swagger';
import { validation } from 'api/utils';
import needsAuthorization from '../auth/authMiddleware';
import pages from './pages';

interface UwaziReqPost extends Request {
  body: paths['/api/pages']['post']['requestBody']['content']['application/json'];
}

type UwaziReq = Request & { query: NonNullable<paths['/api/pages']['get']['parameters']>['query'] };
type UwaziReq2 = Request & { query: NonNullable<paths['/api/page']['get']['parameters']>['query'] };

export default (app: Application) => {
  app.post('/api/pages', needsAuthorization(['admin']), (req: UwaziReqPost, res, next) => {
    pages
      .save(req.body, req.user, req.language)
      .then(response => res.json(response))
      .catch(next);
  });

  app.get('/api/pages', (req: UwaziReq, res, next) => {
    pages
      .get({ ...req.query, language: req.language })
      .then(res.json.bind(res))
      .catch(next);
  });

  app.get('/api/page', (req: UwaziReq2, res, next) => {
    pages.getById(req.query.sharedId, req.language).then(res.json.bind(res)).catch(next);
  });

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

    (req: Request<{}, {}, {}, { sharedId: string }>, res, next) => {
      pages
        .delete(req.query.sharedId)
        .then(response => res.json(response))
        .catch(next);
    }
  );
};
