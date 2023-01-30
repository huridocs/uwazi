import { Application, Request } from 'express';
import { components, paths } from 'api/swagger';
import needsAuthorization from '../auth/authMiddleware';
import pages from './pages';

interface ReqPagesPost extends Request {
  body: components['schemas']['page'];
}

type ReqPages = Request & { query: NonNullable<paths['/api/pages']['get']['parameters']>['query'] };
type ReqPagesDelete = Request & {
  query: NonNullable<paths['/api/pages']['delete']['parameters']>['query'];
};
type ReqPage = Request & { query: NonNullable<paths['/api/page']['get']['parameters']>['query'] };

export default (app: Application) => {
  app.post('/api/pages', needsAuthorization(['admin']), (req: ReqPagesPost, res, next) => {
    pages
      .save(req.body, req.user, req.language)
      .then(response => res.json(response))
      .catch(next);
  });

  app.get('/api/pages', (req: ReqPages, res, next) => {
    pages
      .get({ ...req.query, language: req.language })
      .then(res.json.bind(res))
      .catch(next);
  });

  app.get('/api/page', (req: ReqPage, res, next) => {
    pages.getById(req.query.sharedId, req.language).then(res.json.bind(res)).catch(next);
  });

  app.delete('/api/pages', needsAuthorization(), (req: ReqPagesDelete, res, next) => {
    pages
      .delete(req.query.sharedId)
      .then(response => res.json(response))
      .catch(next);
  });
};
