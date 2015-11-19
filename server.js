require('babel-core/register')({
	stage: 0
});

require.extensions['.scss'] = function() {
	return;
};

var path = require('path');
var express = require('express');
var webpack = require('webpack');
var webpackMiddleware = require('webpack-dev-middleware');
var webpackHotMiddleware = require('webpack-hot-middleware');
var config = require('./webpack.config.js');
var Router = require('./app/Router');
var bodyParser = require('body-parser');

const isDeveloping = process.env.NODE_ENV !== 'production';
const port = isDeveloping ? 3000 : process.env.PORT;
const app = express();
app.use(bodyParser.json());
app.use(express.static(path.resolve(__dirname, 'dist')));

if (isDeveloping) {
  const compiler = webpack(config);

  app.use(webpackMiddleware(compiler, {
    publicpath: config.output.publicpath,
    contentBase: 'app',
    watch: true,
    stats: {
      colors: true,
      hash: false,
      timings: true,
      chunks: false,
      chunkModules: false,
      modules: false
    }
  }));

  app.use(webpackHotMiddleware(compiler, {
    path: '/__webpack_hmr'
  }));
}

app.get('*', Router);

var fetch = require('isomorphic-fetch');
app.post('/login', function(req, res) {
  var user = req.body.username+req.body.password;

  fetch('http://127.0.0.1:5984/uwazi/_design/users/_view/users/?key="'+user+'"')
  .then(function(response) {
    response.json()
    .then(function(json) {
      res.json({success: json.rows.length > 0});
    });
  });

});

app.listen(port, 'localhost', function onStart(err) {
	if (err) {
		console.log(err);
	}
	console.info('==> 🌎 Listening on port %s. Open up http://localhost:%s/ in your browser.', port, port);
});
