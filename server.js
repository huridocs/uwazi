require('babel-core/register')({
  stage: 0
});

require.extensions['.scss'] = function() {
  return;
};

var express = require('express');
const app = express();

require('./app/react/server.js')(app);
require('./app/api/api.js')(app);

const port = process.env.PORT ? 3000 : process.env.PORT;
app.listen(port, 'localhost', function onStart(err) {
  if (err) {
    console.log(err);
  }
  console.info('==> 🌎 Listening on port %s. Open up http://localhost:%s/ in your browser.', port, port);
});
