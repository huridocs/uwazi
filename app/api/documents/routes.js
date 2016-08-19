import path from 'path';
import sanitize from 'sanitize-filename';

import request from '../../shared/JSONRequest.js';
import {db_url as dbUrl} from '../config/database.js';
import documents from './documents';
import needsAuthorization from '../auth/authMiddleware';
import {uploadDocumentsPath} from '../config/paths';

export default (app) => {
  app.post('/api/documents', needsAuthorization, (req, res) => {
    return documents.save(req.body, req.user)
    .then(doc => res.json(doc));
  });

  app.get('/api/documents/html', (req, res) => {
    return documents.getHTML(req.query._id)
    .then(doc => res.json(doc));
  });

  app.get('/api/documents/count_by_template', (req, res) => {
    return documents.countByTemplate(req.query.templateId)
    .then(results => res.json(results));
  });

  app.get('/api/documents/list', (req, res) => {
    let keys;
    if (req.query.keys) {
      keys = JSON.parse(req.query.keys);
    }

    return documents.list(keys)
    .then(results => res.json(results));
  });

  app.get('/api/documents/search', (req, res) => {
    if (req.query.filters) {
      req.query.filters = JSON.parse(req.query.filters);
    }
    if (req.query.types) {
      req.query.types = JSON.parse(req.query.types);
    }
    if (req.query.fields) {
      req.query.fields = JSON.parse(req.query.fields);
    }
    return documents.search(req.query)
    .then(results => res.json(results));
  });

  app.get('/api/documents/match_title', (req, res) => {
    return documents.matchTitle(req.query.searchTerm)
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

    documents.get(id).then(response => {
      res.json(response);
    })
    .catch(console.log);
  });

  app.delete('/api/documents', needsAuthorization, (req, res) => {
    documents.delete(req.query._id)
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
