require("node-jsx").install();
var express = require('express');
var app = express();

var React = require('react/addons');
var ReactApp = React.createFactory(require('./js/react_welcome.js'));

app.get('/', function (req, res) {
  var reactHtml = React.renderToString(ReactApp({}));
  res.render(__dirname+'/views/welcome.ejs', {reactOutput: reactHtml});
});

var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
