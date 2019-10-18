"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _joi = _interopRequireDefault(require("joi"));
var _cookieParser = _interopRequireDefault(require("cookie-parser"));
var _connectMongo = _interopRequireDefault(require("connect-mongo"));
var _mongoose = _interopRequireDefault(require("mongoose"));
var _passport = _interopRequireDefault(require("passport"));
var _expressSession = _interopRequireDefault(require("express-session"));
var _uniqueID = _interopRequireDefault(require("../../shared/uniqueID"));
var _svgCaptcha = _interopRequireDefault(require("svg-captcha"));
var _settings2 = _interopRequireDefault(require("../settings"));
var _urlJoin = _interopRequireDefault(require("url-join"));

var _utils = require("../utils");

require("./passport_conf.js");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const MongoStore = (0, _connectMongo.default)(_expressSession.default);var _default =

app => {
  app.use((0, _cookieParser.default)());

  app.use((0, _expressSession.default)({
    secret: app.get('env') === 'production' ? (0, _uniqueID.default)() : 'harvey&lola',
    store: new MongoStore({
      mongooseConnection: _mongoose.default.connection }),

    resave: false,
    saveUninitialized: false }));

  app.use(_passport.default.initialize());
  app.use(_passport.default.session());

  app.post(
  '/api/login',

  _utils.validation.validateRequest(_joi.default.object({
    username: _joi.default.string().required(),
    password: _joi.default.string().required() }).
  required()),

  (req, res, next) => {
    _passport.default.authenticate('local', (err, user) => {
      if (user === false) {
        res.status(401);
        res.json({ status: 'Unauthorized' });
      } else {
        req.logIn(user, error => {
          if (error) {
            next(err);
          } else {
            res.status(200);
            res.json({ success: true });
          }
        });
      }
    })(req, res, next);
  });

  app.get('/api/user', (req, res) => {
    res.json(req.user || {});
  });

  app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
  });

  app.get('/captcha', (req, res) => {
    const captcha = _svgCaptcha.default.createMathExpr({ mathMin: 1, mathMax: 19, mathOperator: '+' });
    req.session.captcha = captcha.text;
    res.type('svg');
    res.send(captcha.data);
  });

  app.get('/remotecaptcha', async (req, res) => {
    const _settings = await _settings2.default.get(true);
    const remoteResponse = await fetch((0, _urlJoin.default)(_settings.publicFormDestination, '/captcha'));
    const [remotecookie] = remoteResponse.headers._headers['set-cookie'];
    req.session.remotecookie = remotecookie;
    res.type('svg');
    remoteResponse.body.pipe(res);
  });
};exports.default = _default;