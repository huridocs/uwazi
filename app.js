require("node-jsx").install();
var express = require('express');
var app = express();

var react = require('react');
var router = require('react-router');

var renderToString = require('react-dom/server').renderToString;
var routes = require('./js/routes.jsx');
var match = require('react-router').match;
var RoutingContext = require('react-router').RoutingContext;
//var reactApp = React.createFactory(require('./js/react_welcome.js'));
//var layout = require('./js/layout.jsx');

app.get('/', function (req, res) {

  match({ routes: routes, location: req.url }, function(error, redirectLocation, renderProps) {
    res.status(200).send(renderToString(new RoutingContext(renderProps)))
  });

  //res.render(__dirname+'/views/index.ejs', {
    //content: content
  //});

  //router.run(routes, '/', function (Handler) {
    //var content = react.renderToString(react.createElement(Handler));
    //res.render(__dirname+'/views/index.ejs', {
      //content: content
    //});
  //});
})

//app.get('/', function (req, res) {
  //var reactHtml = React.renderToString(ReactApp({}));
  //res.render(__dirname+'/views/welcome.ejs', {reactOutput: reactHtml});
//});

var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
