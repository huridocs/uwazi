import fetch from 'isomorphic-fetch';
import {db_url} from '../config/database.js'

export default app => {

  app.post('/api/templates', (req, res) => {

    req.body.type = 'template';

    fetch(db_url, {
      method:'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(req.body)
    })
    .then((response) => response.json())
    .then((response) => {
      res.json(response);
    });

  });

  app.get('/api/templates', (req, res) => {

    fetch(db_url+'/_design/templates/_view/all', {
      method:'GET',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      credentials: 'same-origin'
    })
    .then(response => response.json())
    .then((response) => {
      res.json(response)
    });

  });

}
