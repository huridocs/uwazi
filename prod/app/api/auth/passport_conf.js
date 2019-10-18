"use strict";var _passport = _interopRequireDefault(require("passport"));
var _passportLocal = _interopRequireDefault(require("passport-local"));
var _users = _interopRequireDefault(require("../users/users"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const getDomain = req => `${req.protocol}://${req.get('host')}`;

_passport.default.use('local', new _passportLocal.default(
{
  passReqToCallback: true },

(req, username, password, done) => {
  _users.default.login({ username, password }, getDomain(req)).
  then(user => done(null, user)).
  catch(e => e.code === 401 ? done(null, false) : done(e));
}));


_passport.default.serializeUser((user, done) => {
  done(null, user._id);
});

_passport.default.deserializeUser((id, done) => {
  _users.default.getById(id).
  then(user => {
    delete user.password;
    done(null, user);
  });
});