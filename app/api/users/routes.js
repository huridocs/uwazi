import fetch from 'isomorphic-fetch';
import {db_url as dbURL} from '../config/database.js';
import needsAuthorization from '../auth/authMiddleware';

export default app => {
  app.post('/api/users', needsAuthorization, (req, res) => {
    fetch(dbURL + '/' + req.body._id)
    .then(response => response.json())
    .then(user => Object.assign(user, req.body))
    .then(user => {
      fetch(dbURL + '/' + user._id, {
        method: 'PUT',
        headers: {Accept: 'application/json', 'Content-Type': 'application/json'},
        credentials: 'same-origin',
        body: JSON.stringify(user)
      })
      .then(() => {
        res.json('');
      });
    });
  });
};
