import bodyParser from 'body-parser';
import db_config from './config/database.js';
import session from 'express-session';

export default (app, server) => {
  //set db to use
  db_config.db_url = db_config.production;

  //common middlewares
  app.use(bodyParser.json());

  //module routes
  require('./auth/routes.js')(app);
  require('./socketio/routes.js')(server, app);
  require('./references/routes.js')(app);
  require('./users/routes.js')(app);
  require('./templates/routes.js')(app);
  require('./thesauris/routes.js')(app);
  require('./documents/routes.js')(app);
  require('./upload/routes.js')(app);
};
