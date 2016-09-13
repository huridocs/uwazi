import request from '../../shared/JSONRequest.js';
import {db_url as dbUrl} from '../config/database.js';
import pages from './pages';
import needsAuthorization from '../auth/authMiddleware';

export default (app) => {
  app.post('/api/pages', needsAuthorization, (req, res) => {
    return pages.save(req.body, req.user)
    .then(doc => res.json(doc));
  });

  app.get('/api/pages/list', (req, res) => {
    let keys;
    if (req.query.keys) {
      keys = JSON.parse(req.query.keys);
    }

    return pages.list(keys)
    .then(results => res.json(results));
  });

  app.get('/api/pages', (req, res) => {
    let id = '';
    let url = dbUrl + '/_design/pages/_view/all';

    if (req.query && req.query._id) {
      id = '?key="' + req.query._id + '"';
      url = dbUrl + '/_design/pages/_view/all' + id;
    }

    request.get(url)
    .then(response => {
      response.json.rows = response.json.rows.map(row => row.value);
      res.json(response.json);
    })
    .catch(console.log);
  });

  app.delete('/api/pages', needsAuthorization, (req, res) => {
    pages.delete(req.query._id)
    .then((response) => {
      res.json(response);
    })
    .catch((error) => {
      res.json({error: error.json});
    });
  });
};
