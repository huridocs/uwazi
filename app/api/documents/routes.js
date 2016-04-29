import request from '../../shared/JSONRequest.js';
import {db_url} from '../config/database.js';
import documents from './documents';
import sanitizeResponse from '../utils/sanitizeResponse';
import needsAuthorization from '../auth/authMiddleware';

export default app => {
  app.post('/api/documents', (req, res) => {
    if(!req.user){
      res.status(401);
      res.json({error: 'Unauthorized'});
      return;
    }

    let document = req.body;
    document.type = 'document';
    document.user = req.user;

    let url = db_url;
    if(document._id){
      url = db_url + '/_design/documents/_update/partialUpdate/'+document._id;
    }

    request.post(url, document)
    .then((response) => {
      res.json(response.json);
    })
    .catch(console.log);
  });

  app.get('/api/documents/html', (req, res) => {
    return documents.getHTML(req.query._id)
    .then((doc) => {
      res.json(doc);
    });
  });

  app.get('/api/documents/count_by_template', (req, res) => {
    return documents.countByTemplate(req.query.templateId)
    .then((results) => {
      res.json(results);
    });
  });

  app.get('/api/documents/search', (req, res) => {
    return documents.search(req.query)
    .then((results) => {
      res.json(results);
    });
  });

  app.get('/api/documents/match_title', (req, res) => {
    return documents.matchTitle(req.query.searchTerm)
    .then((results) => {
      res.json(results);
    });
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

  app.get('/api/uploads', needsAuthorization, (req, res) => {
    let url = db_url+'/_design/documents/_view/uploads?key="'+req.user._id+'"';

    request.get(url)
    .then(response => {
      res.json(response.json);
    })
    .catch(console.log);
  });

  app.delete('/api/documents', (req, res) => {

    let url = db_url+'/'+req.body._id+'?rev='+req.body._rev;

    request.delete(url)
    .then((response) => {
      res.json(response.json)
    })
    .catch((error) => {
      res.json({error: error.json});
    });

  });
}
