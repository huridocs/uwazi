import { objectIdSchema } from 'shared/types/commonSchemas';
import { validation } from '../utils';
import documents from './documents';
import needsAuthorization from '../auth/authMiddleware';
import templates from '../templates';

export default app => {
  app.post('/api/documents', needsAuthorization(['admin', 'editor']), (req, res, next) =>
    documents
      .save(req.body, { user: req.user, language: req.language })
      .then(doc => res.json(doc))
      .catch(next)
  );

  app.get(
    '/api/documents/count_by_template',
    validation.validateRequest({
      type: 'object',
      properties: {
        query: {
          type: 'object',
          required: ['templateId'],
          additionalProperties: false,
          properties: {
            templateId: objectIdSchema,
          },
        },
      },
    }),
    (req, res, next) =>
      templates
        .countByTemplate(req.query.templateId)
        .then(results => res.json(results))
        .catch(next)
  );

  app.get(
    '/api/documents',
    validation.validateRequest({
      type: 'object',
      properties: {
        query: {
          type: 'object',
          additionalProperties: false,
          properties: {
            _id: objectIdSchema,
          },
          required: ['_id'],
        },
      },
    }),
    (req, res, next) => {
      let id;

      if (req.query && req.query._id) {
        id = req.query._id;
      }

      documents
        .getById(id, req.language)
        .then(response => {
          if (!response) {
            res.json({}, 404);
            return;
          }
          res.json({ rows: [response] });
        })
        .catch(next);
    }
  );

  app.delete(
    '/api/documents',
    needsAuthorization(['admin', 'editor', 'collaborator']),
    validation.validateRequest({
      type: 'object',
      properties: {
        query: {
          type: 'object',
          additionalProperties: false,
          properties: {
            sharedId: objectIdSchema,
          },
          required: ['sharedId'],
        },
      },
    }),
    (req, res, next) => {
      documents
        .delete(req.query.sharedId)
        .then(response => res.json(response))
        .catch(next);
    }
  );
};
