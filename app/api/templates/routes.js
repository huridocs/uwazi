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
    .then((response) => {
      res.json('')
    });

  });

}
