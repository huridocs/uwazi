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
      return request.get(db_url + '/_design/documents/_view/all?key="'+response.json.id+'"');
    })
    .then((response) => {
      res.json(response.json.rows[0]);
    })
    .catch(console.log);
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
      res.json(response.json);
    });
  });

  app.get('/api/uploads', (req, res) => {

    let url = db_url+'/_design/documents/_view/uploads';

    request.get(url)
    .then(response => {
      res.json(response.json);
    });
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
