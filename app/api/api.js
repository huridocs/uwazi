import bodyParser from 'body-parser';
import languageMiddleware from './utils/languageMiddleware';
import db_config from './config/database';
import elasticConfig from './config/elasticIndexes';

export default (app, server) => {
  //set db to use
  db_config.db_url = db_config[app.get('env')];
  elasticConfig.index = elasticConfig[app.get('env')];

  //common middlewares
  app.use(bodyParser.json());
  app.use(languageMiddleware);

  //module routes
  require('./auth/routes.js')(app);
  require('./socketio/routes.js')(server, app);
  require('./references/routes.js')(app);
  require('./users/routes.js')(app);
  require('./templates/routes.js')(app);
  require('./search/routes.js')(app);
  require('./thesauris/routes.js')(app);
  require('./relationtypes/routes.js')(app);
  require('./documents/routes.js')(app);
  require('./entities/routes.js')(app);
  require('./pages/routes.js')(app);
  require('./upload/routes.js')(app);
  require('./settings/routes.js')(app);
  require('./i18n/routes.js')(app);
};
