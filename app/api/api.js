import bodyParser from 'body-parser'
import fetch from 'isomorphic-fetch'

export default app => {

  app.use(bodyParser.json());

  app.post('/api/login', function(req, res) {
    var user = req.body.username+req.body.password;

    fetch('http://127.0.0.1:5984/uwazi/_design/users/_view/users/?key="'+user+'"')
    .then(function(response) {
      response.json()
      .then(function(json) {
        res.json({success: json.rows.length > 0});
      });
    });
  });

}
