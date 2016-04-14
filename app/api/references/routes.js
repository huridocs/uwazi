import request from '../../shared/JSONRequest.js';
import {db_url} from '../config/database.js'

export default app => {

  app.post('/api/references', (req, res) => {
    req.body.type = 'reference';

    request.post(db_url, req.body)
    .then((response) => {
      res.json(response.json);
    })
    .catch((error) => {
      res.json({error: error.json});
    });
  });

  app.get('/api/references', (req, res) => {

    let id = '';
    if(req.query && req.query.sourceDocument){
      id = '?key="'+req.query.sourceDocument+'"';
    }

    let url = db_url+'/_design/references/_view/by_source_document'+id;

    request.get(url)
    .then((response) => {
      response.json.rows = response.json.rows.map((r) => r.value);
      res.json(response.json);
    })
    .catch((error) => {
      res.json({error: error.json});
    });

  });

}
