import fetch from 'isomorphic-fetch';
import {db_url} from '../config/database.js'

export default app => {

  app.post('/api/users', (req, res) => {

    fetch(db_url+'/'+req.body._id)
    .then(response => response.json())
    .then(user => Object.assign(user, req.body))
    .then(user => {
      fetch(db_url+'/'+user._id, {
        method:'PUT',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(user)
      })
      .then((response) => {res.json('')});
    })

  });

}
