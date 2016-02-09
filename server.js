require('es6-promise').polyfill(); // Required in some browsers
require('babel-core/register'); //babel polyfill ES6

require.extensions['.scss'] = function() { return; };
require.extensions['.css'] = function() { return; };

var express = require('express');
var path = require('path');
var compression = require('compression');
const app = express();

app.use(compression());
app.use(express.static(path.resolve(__dirname, 'dist')));
app.use('/uploaded_documents', express.static(path.resolve(__dirname, 'uploaded_documents')));

require('./app/api/api.js')(app);
require('./app/react/server.js')(app);

const port = 3000;
app.listen(port, function onStart(err) {
  if (err) {
    console.log(err);
  }
  console.info('==> 🌎 Listening on port %s. Open up http://localhost:%s/ in your browser.', port, port);
});
