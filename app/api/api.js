import languageMiddleware from './utils/languageMiddleware';
import activitylogMiddleware from './activitylog/activitylogMiddleware';
import elasticConfig from './config/elasticIndexes';

export default (app, server) => {
  //set db to use
  elasticConfig.index = elasticConfig[app.get('env')];

  //common middlewares
  app.use(languageMiddleware);
  app.use(activitylogMiddleware);

  //module routes
  //require('./auth/routes.js')(app);

  require('./socketio/middleware.js').default(server, app);
  require('./relationships/routes.js').default(app);
  require('./activitylog/routes.js').default(app);
  require('./users/routes.js').default(app);
  require('./templates/routes.js').default(app);
  require('./search/routes.js').default(app);
  require('./semanticsearch/routes.js').default(app);
  require('./thesauris/routes.js').default(app);
  require('./relationtypes/routes.js').default(app);
  require('./documents/routes.js').default(app);
  require('./contact/routes.js').default(app);
  require('./entities/routes.js').default(app);
  require('./pages/routes.js').default(app);
  require('./upload/routes.js').default(app);
  require('./settings/routes.js').default(app);
  require('./i18n/routes.js').default(app);
  require('./attachments/routes.js').default(app);
  require('./sync/routes.js').default(app);
  require('./swagger/swaggerconfig.js').default(app);
};
