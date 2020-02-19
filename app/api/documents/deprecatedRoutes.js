import Joi from 'joi';

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

  app.post(
    '/api/documents/pdfInfo',
    validation.validateRequest(
      Joi.object()
        .keys({
          _id: Joi.objectId(),
          pdfInfo: Joi.object().pattern(
            Joi.number(),
            Joi.object().keys({
              chars: Joi.number(),
            })
          ),
        })
        .required()
    ),
    (req, res, next) =>
      documents
        .savePDFInfo(req.body._id, req.body.pdfInfo)
        .then(doc => res.json(doc))
        .catch(next)
  );

  app.get(
    '/api/documents/count_by_template',
    validation.validateRequest(
      Joi.object()
        .keys({
          templateId: Joi.objectId().required(),
        })
        .required(),
      'query'
    ),
    (req, res, next) =>
      templates
        .countByTemplate(req.query.templateId)
        .then(results => res.json(results))
        .catch(next)
  );

  app.get(
    '/api/documents',
    validation.validateRequest(
      Joi.object().keys({
        _id: Joi.string().required(),
      }),
      'query'
    ),
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
    needsAuthorization(['admin', 'editor']),
    validation.validateRequest(
      Joi.object({
        sharedId: Joi.string().required(),
      }).required(),
      'query'
    ),

    (req, res, next) => {
      documents
        .delete(req.query.sharedId)
        .then(response => res.json(response))
        .catch(next);
    }
  );
};
