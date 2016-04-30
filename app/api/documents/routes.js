import request from '../../shared/JSONRequest.js';
import {db_url} from '../config/database.js';
import documents from './documents';
import sanitizeResponse from '../utils/sanitizeResponse';
import needsAuthorization from '../auth/authMiddleware';

export default app => {
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

  app.get('/api/documents/search', (req, res) => {
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
    let url = db_url+'/_design/documents/_view/list';

    if(req.query && req.query._id){
      id = '?key="'+req.query._id+'"';
      url = db_url+'/_design/documents/_view/all'+id;
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

  app.get('/api/documents/newest', (req, res) => {
    request.get(db_url+'/_design/documents/_view/list')
    .then(response => {
      res.json(sanitizeResponse(response.json));
    })
    .catch(console.log);
  });

  app.get('/api/documents/relevant', (req, res) => {
    request.get(db_url+'/_design/documents/_view/list')
    .then(response => {
      res.json(sanitizeResponse(response.json));
    })
    .catch(console.log);
  });

  app.delete('/api/documents', (req, res) => {
    let url = db_url+'/'+req.body._id+'?rev='+req.body._rev;

    request.delete(url)
    .then((response) => {
      res.json(response.json);
    })
    .catch((error) => {
      res.json({error: error.json});
    });
  });
};
