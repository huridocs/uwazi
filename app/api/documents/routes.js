import Joi from 'joi';
import sanitize from 'sanitize-filename';

import { createError } from 'api/utils';
import path from 'path';

import { uploadDocumentsPath } from '../config/paths';
import { validateRequest } from '../utils';
import documents from './documents';
import needsAuthorization from '../auth/authMiddleware';
import templates from '../templates';

export default (app) => {
  app.post('/api/documents', needsAuthorization(['admin', 'editor']), (req, res, next) => documents
  .save(req.body, { user: req.user, language: req.language })
  .then(doc => res.json(doc))
  .catch(next));

  app.post('/api/documents/pdfInfo', (req, res, next) => documents.savePDFInfo(req.body, { language: req.language })
  .then(doc => res.json(doc))
  .catch(next));

  app.get('/api/documents/count_by_template', (req, res, next) => templates.countByTemplate(req.query.templateId)
  .then(results => res.json(results))
  .catch(next));

  app.get('/api/documents', (req, res, next) => {
    let id;

    if (req.query && req.query._id) {
      id = req.query._id;
    }

    documents.getById(id, req.language).then((response) => {
      if (!response) {
        res.json({}, 404);
        return;
      }
      res.json({ rows: [response] });
    })
    .catch(next);
  });

  app.delete(
    '/api/documents',
    needsAuthorization(['admin', 'editor']),

    validateRequest(Joi.object({
      sharedId: Joi.string().required(),
    }).required(), 'query'),

    (req, res, next) => {
      documents.delete(req.query.sharedId)
      .then(response => res.json(response))
      .catch(next);
    }
  );

  app.get(
    '/api/documents/download',

    validateRequest(Joi.object({
      _id: Joi.string().required(),
    }).required(), 'query'),

    (req, res, next) => {
      documents.getById(req.query._id)
      .then((response) => {
        if (!response) {
          throw createError('document does not exist', 404);
        }
        const basename = path.basename(response.file.originalname, path.extname(response.file.originalname));
        res.download(path.join(uploadDocumentsPath, response.file.filename), sanitize(basename + path.extname(response.file.filename)));
      })
      .catch(next);
    }
  );
};
