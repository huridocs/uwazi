import path from 'path';
import sanitize from 'sanitize-filename';

import request from '../../shared/JSONRequest.js';
import {db_url as dbUrl} from '../config/database.js';
import documents from './documents';
import templates from '../templates';
import needsAuthorization from '../auth/authMiddleware';
import {uploadDocumentsPath} from '../config/paths';

export default (app) => {
  app.post('/api/documents', needsAuthorization, (req, res) => {
    return documents.save(req.body, {user: req.user, language: req.language})
    .then(doc => res.json(doc))
    .catch(error => {
      console.log(error);
      res.json({error: error});
    });
  });

  app.get('/api/documents/html', (req, res) => {
    return documents.getHTML(req.query._id, req.language)
    .then(doc => res.json(doc));
  });

  app.get('/api/documents/count_by_template', (req, res) => {
    return templates.countByTemplate(req.query.templateId)
    .then(results => res.json(results));
  });

  app.get('/api/documents/uploads', needsAuthorization, (req, res) => {
    documents.getUploadsByUser(req.user)
    .then(response => res.json(response))
    .catch(error => res.json({error: error}));
  });

  app.get('/api/documents', (req, res) => {
    let id;

    if (req.query && req.query._id) {
      id = req.query._id;
    }

    documents.get(id, req.language).then(response => {
      res.json(response);
    })
    .catch(console.log);
  });

  app.delete('/api/documents', needsAuthorization, (req, res) => {
    documents.delete(req.query.sharedId)
    .then((response) => {
      res.json(response);
    })
    .catch((error) => {
      res.json({error: error.json});
    });
  });

  app.get('/api/documents/download', (req, res) => {
    request.get(`${dbUrl}/${req.query._id}`)
    .then((response) => {
      res.download(uploadDocumentsPath + response.json.file.filename, sanitize(response.json.title + path.extname(response.json.file.filename)));
    })
    .catch((error) => {
      res.json({error: error.json}, 500);
    });
  });
};
