import {db_url as dbURL} from 'api/config/database.js';
import request from 'shared/JSONRequest.js';
import generateNames from 'api/templates/generateNames';

export default app => {
  app.post('/api/templates', (req, res) => {
    req.body.type = 'template';
    req.body.properties = req.body.properties || [];
    req.body.properties = generateNames(req.body.properties);

    request.post(dbURL, req.body)
    .then((response) => {
      res.json(response.json);
    })
    .catch((error) => {
      res.json({error: error.json});
    });
  });

  app.get('/api/templates', (req, res) => {
    let id = '';
    if (req.query && req.query._id) {
      id = '?key="' + req.query._id + '"';
    }

    let url = dbURL + '/_design/templates/_view/all' + id;

    request.get(url)
    .then((response) => {
      response.json.rows = response.json.rows.map((row) => row.value);
      res.json(response.json);
    })
    .catch((error) => {
      res.json({error: JSON.stringify(error)});
    });
  });

  app.delete('/api/templates', (req, res) => {
    let url = dbURL + '/' + req.body._id + '?rev=' + req.body._rev;

    request.delete(url)
    .then((response) => {
      res.json(response.json);
    })
    .catch((error) => {
      res.json({error: error.json});
    });
  });
};
