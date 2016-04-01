import request from '../../shared/JSONRequest.js';
import {db_url} from '../config/database.js'

export default app => {

  app.post('/api/templates', (req, res) => {

    req.body.type = 'template';
    req.body.fields = req.body.fields || [];

    request.post(db_url, req.body)
    .then((response) => {
      res.json(response.json);
    })
    .catch((error) => {
      res.json({error: error.json});
    });

  });

  app.get('/api/templates', (req, res) => {
    let id = '';
    if(req.query && req.query._id){
      id = '?key="'+req.query._id+'"';
    }

    let url = db_url+'/_design/templates/_view/all'+id;

    request.get(url)
    .then((response) => {
      res.json(response.json);
    })
    .catch((error) => {
      res.json({error: error.json});
    });
  });

  app.delete('/api/templates', (req, res) => {

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
