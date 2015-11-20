require('babel-core/register')({
	stage: 0
});

require.extensions['.scss'] = function() {
	return;
};

var express = require('express');
const app = express();

var webpack = require('webpack');
var webpackMiddleware = require('webpack-dev-middleware');
var webpackHotMiddleware = require('webpack-hot-middleware');
var config = require('./webpack.config.js');

const isDeveloping = process.env.NODE_ENV !== 'production';

if (isDeveloping) {
  const compiler = webpack(config);

  app.use(webpackMiddleware(compiler, {
    publicpath: config.output.publicpath,
    contentBase: 'app',
    watch: false,
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

require('./app/react/server.js')(app);
require('./app/api/api.js')(app);

const port = isDeveloping ? 3000 : process.env.PORT;
app.listen(port, 'localhost', function onStart(err) {
	if (err) {
		console.log(err);
	}
	console.info('==> 🌎 Listening on port %s. Open up http://localhost:%s/ in your browser.', port, port);
});
