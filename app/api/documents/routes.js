import request from '../../shared/JSONRequest.js';
import {db_url as dbUrl} from '../config/database.js';
import documents from './documents';
import needsAuthorization from '../auth/authMiddleware';

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
    let id = '';
    let url = dbUrl + '/_design/documents/_view/docs';

    if (req.query && req.query._id) {
      id = '?key="' + req.query._id + '"';
      url = dbUrl + '/_design/documents/_view/docs' + id;
    }

    request.get(url)
    .then(response => {
      response.json.rows = response.json.rows.map(row => row.value);
      if (response.json.rows.length === 1 && response.json.rows[0].css) {
        response.json.rows[0].css = response.json.rows[0].css.replace(/(\..*?){/g, '._' + response.json.rows[0]._id + ' $1 {');
        response.json.rows[0].fonts = '';
      }
      res.json(response.json);
    })
    .catch(console.log);
  });

  app.delete('/api/documents', needsAuthorization, (req, res) => {
    request.delete(`${dbUrl}/${req.query._id}`, {rev: req.query._rev})
    .then((response) => {
      res.json(response.json);
    })
    .catch((error) => {
      res.json({error: error.json});
    });
  });

  app.get('/api/documents/download/:id', (req, res) => {
    request.get(`${dbUrl}/${req.params.id}`)
    .then((response) => {
      res.download('uploaded_documents/' + response.json.file.filename);
    })
    .catch((error) => {
      res.json({error: error.json});
    });
  });
};
