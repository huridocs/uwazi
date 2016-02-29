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

}
