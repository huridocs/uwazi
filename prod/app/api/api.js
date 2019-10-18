"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _languageMiddleware = _interopRequireDefault(require("./utils/languageMiddleware"));
var _activitylogMiddleware = _interopRequireDefault(require("./activitylog/activitylogMiddleware"));
var _elasticIndexes = _interopRequireDefault(require("./config/elasticIndexes"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var _default =

(app, server) => {
  //set db to use
  _elasticIndexes.default.index = _elasticIndexes.default[app.get('env')];

  //common middlewares
  app.use(_languageMiddleware.default);
  app.use(_activitylogMiddleware.default);

  //module routes
  //require('./auth/routes.js')(app);

  require("./socketio/middleware.js").default(server, app);
  require("./relationships/routes.js").default(app);
  require("./activitylog/routes.js").default(app);
  require("./users/routes.js").default(app);
  require("./templates/routes.js").default(app);
  require("./search/routes.js").default(app);
  require("./semanticsearch/routes.js").default(app);
  require("./thesauris/routes.js").default(app);
  require("./relationtypes/routes.js").default(app);
  require("./documents/routes.js").default(app);
  require("./contact/routes.js").default(app);
  require("./entities/routes.js").default(app);
  require("./pages/routes.js").default(app);
  require("./upload/routes.js").default(app);
  require("./settings/routes.js").default(app);
  require("./i18n/routes.js").default(app);
  require("./attachments/routes.js").default(app);
  require("./sync/routes.js").default(app);
  require("./swagger/swaggerconfig.js").default(app);
};exports.default = _default;