/** @format */

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

  require('./socketio/middleware').default(server, app);
  require('./auth2fa/routes').default(app);
  require('./relationships/routes').default(app);
  require('./activitylog/routes').default(app);
  require('./users/routes').default(app);
  require('./templates/routes').default(app);
  require('./search/routes').default(app);
  require('./semanticsearch/routes').default(app);
  require('./topicclassification/routes').default(app);
  require('./thesauris/routes').default(app);
  require('./relationtypes/routes').default(app);
  require('./documents/routes').default(app);
  require('./contact/routes').default(app);
  require('./entities/routes').default(app);
  require('./pages/routes').default(app);
  require('./upload/routes').default(app);
  require('./settings/routes').default(app);
  require('./i18n/routes').default(app);
  require('./attachments/routes').default(app);
  require('./sync/routes').default(app);
  require('./swagger/swaggerconfig').default(app);
};
