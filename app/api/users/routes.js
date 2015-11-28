import fetch from 'isomorphic-fetch';

export default app => {

  app.post('/api/users', (req, res) => {

    fetch('http://127.0.0.1:5984/uwazi_development/'+req.body._id)
    .then(response => response.json())
    .then(user => Object.assign(user, req.body))
    .then(user => {
      fetch('http://127.0.0.1:5984/uwazi_development/'+user._id,
      {
        method:'PUT',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(user)
      })
      .then((response) => {res.json('')});
    })

  });

}
