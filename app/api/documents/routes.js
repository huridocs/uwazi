import request from '../../shared/JSONRequest.js'
import {db_url} from '../config/database.js'

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
    request.post(db_url, document)
    .then((response) => {
      return request.get(db_url+'/'+response.json.id);
    })
    .then((response) => {
      res.json(response.json);
    })
    .catch(console.log);
  });

  app.get('/api/documents', (req, res) => {
    request.get(db_url + '/_design/documents/_view/all')
    .then(response => {
        res.json(response.json);
    });

  });

}
