import request from '../../shared/JSONRequest.js';
import {db_url as dbUrl} from '../config/database.js'

export default app => {
  app.post('/api/thesauris', (req, res) => {
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
      res.json(response.json);
    })
    .catch((error) => {
      res.json({error: error.json});
    });
  });

  app.delete('/api/thesauris', (req, res) => {
    let url = dbUrl + '/' + req.body._id + '?rev=' + req.body._rev;

    request.delete(url)
    .then((response) => {
      res.json(response.json);
    })
    .catch((error) => {
      res.json({error: error.json});
    });
  });
};
