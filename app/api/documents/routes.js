import request from '../../shared/JSONRequest.js'
import {db_url} from '../config/database.js'

export default app => {

  app.post('/api/documents', (req, res) => {
    let document = req.body;
    document.type = 'document';
    request.post(db_url, document)
    .then((response) => {
      res.json(response.json);
    });
  });

  app.get('/api/documents', (req, res) => {
    request.get(db_url + '/_design/documents/_view/all')
    .then(response => {
        res.json(response.json);
    });

  });

}
