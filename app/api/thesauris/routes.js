import request from '../../shared/JSONRequest.js';
import {db_url as dbUrl} from '../config/database.js';
import needsAuthorization from '../auth/authMiddleware';

export default app => {
  app.post('/api/thesauris', needsAuthorization, (req, res) => {
    req.body.type = 'thesauri';
    req.body.values = req.body.values || [];

    let nextId = req.body.values.reduce((latestId, value) => {
      return value.id >= latestId ? value.id : latestId;
    }, 0) + 1;

    req.body.values.map((value) => {
      if (!value.id) {
        value.id = nextId;
        nextId += 1;
      }
      return value;
    });

    request.post(dbUrl, req.body)
    .then((response) => {
      res.json(response.json);
    })
    .catch((error) => {
      res.json({error: error.json});
    });
  });

  app.get('/api/thesauris', (req, res) => {
    let id = '';
    if (req.query && req.query._id) {
      id = '?key="' + req.query._id + '"';
    }

    let url = dbUrl + '/_design/thesauris/_view/all' + id;
    request.get(url)
    .then((response) => {
      response.json.rows = response.json.rows.map((row) => row.value);
      res.json(response.json);
    })
    .catch((error) => {
      res.json({error: error.json});
    });
  });

  app.delete('/api/thesauris', needsAuthorization, (req, res) => {
    request.delete(`${dbUrl}/${req.query._id}`, {rev: req.query._rev})
    .then((response) => {
      res.json(response.json);
    })
    .catch((error) => {
      res.json({error: error.json});
    });
  });
};
