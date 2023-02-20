/* eslint-disable global-require */
import activitylogMiddleware from './activitylog/activitylogMiddleware';
import CSRFMiddleware from './auth/CSRFMiddleware';
import languageMiddleware from './utils/languageMiddleware';

export default (app, server) => {
  //common middlewares
  app.use(CSRFMiddleware);
  app.use(languageMiddleware);
  app.use(activitylogMiddleware);

  require('./socketio/setupSockets').setupApiSockets(server, app);

  require('./auth2fa/routes').default(app);
  require('./relationships/routes').default(app);
  require('./activitylog/routes').default(app);
  require('./users/routes').default(app);
  require('./templates/routes').default(app);
  require('./search/deprecatedRoutes').default(app);
  require('./search/routes').default(app);
  require('./search.v2/routes').searchRoutes(app);
  require('./topicclassification/routes').default(app);
  require('./thesauri/routes').default(app);
  require('./relationtypes/routes').default(app);
  require('./documents/deprecatedRoutes').default(app);
  require('./documents/routes').documentRoutes(app);
  require('./contact/routes').default(app);
  require('./entities/routes').default(app);
  require('./pages/routes').default(app);
  require('./files/jsRoutes.js').default(app);
  require('./files/routes').default(app);
  require('./files/exportRoutes').default(app);
  require('./files/ocrRoutes').ocrRoutes(app);
  require('./settings/routes').default(app);
  require('./i18n/routes').default(app);
  require('./sync/routes').default(app);
  require('./tasks/routes').default(app);
  require('./usergroups/routes').default(app);
  require('./permissions/routes').permissionRoutes(app);
  require('./suggestions/routes').suggestionsRoutes(app);
  require('./suggestions/extractorsRoutes').extractorsRoutes(app);
  require('./preserve/routes').PreserveRoutes(app);
  require('./relationships.v2/routes/routes').default(app);
  require('./stats/routes').default(app);
};
