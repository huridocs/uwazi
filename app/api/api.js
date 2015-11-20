var bodyParser = require('body-parser');
var fetch = require('isomorphic-fetch');

module.exports = function(app) {

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
