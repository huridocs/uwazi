"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _sha = _interopRequireDefault(require("crypto-js/sha256"));
var _crypto = _interopRequireDefault(require("crypto"));

var _utils = require("../utils");
var _uniqueID = _interopRequireDefault(require("../../shared/uniqueID"));
var _encryptPassword = _interopRequireWildcard(require("../auth/encryptPassword"));

var _mailer = _interopRequireDefault(require("../utils/mailer"));
var _usersModel = _interopRequireDefault(require("./usersModel"));
var _passwordRecoveriesModel = _interopRequireDefault(require("./passwordRecoveriesModel"));
var _settings2 = _interopRequireDefault(require("../settings/settings"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function ownKeys(object, enumerableOnly) {var keys = Object.keys(object);if (Object.getOwnPropertySymbols) {keys.push.apply(keys, Object.getOwnPropertySymbols(object));}if (enumerableOnly) keys = keys.filter(function (sym) {return Object.getOwnPropertyDescriptor(object, sym).enumerable;});return keys;}function _objectSpread(target) {for (var i = 1; i < arguments.length; i++) {if (i % 2) {var source = arguments[i] != null ? arguments[i] : {};ownKeys(source, true).forEach(function (key) {_defineProperty(target, key, source[key]);});} else if (Object.getOwnPropertyDescriptors) {Object.defineProperties(target, Object.getOwnPropertyDescriptors(arguments[i]));} else {ownKeys(source).forEach(function (key) {Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(arguments[i], key));});}}return target;}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}

const MAX_FAILED_LOGIN_ATTEMPTS = 6;

const generateUnlockCode = () => _crypto.default.randomBytes(32).toString('hex');

const conformRecoverText = (options, _settings, domain, key, user) => {
  const response = {};
  if (!options.newUser) {
    response.subject = 'Password set';
    response.text = `To set your password click on the following link:\n${domain}/setpassword/${key}`;
  }

  if (options.newUser) {
    const siteName = _settings.site_name || 'Uwazi';
    const text = 'Hello!\n\n' +
    `The administrators of ${siteName} have created an account for you under the user name:\n` +
    `${user.username}\n\n` +
    'To complete this process, please create a strong password by clicking on the following link:\n' +
    `${domain}/setpassword/${key}?createAccount=true\n\n` +
    'For more information about the Uwazi platform, visit https://www.uwazi.io.\n\nThank you!\nUwazi team';

    const htmlLink = `<a href="${domain}/setpassword/${key}?createAccount=true">${domain}/setpassword/${key}?createAccount=true</a>`;

    response.subject = `Welcome to ${siteName}`;
    response.text = text;
    response.html = `<p>${
    response.text.
    replace(new RegExp(user.username, 'g'), `<b>${user.username}</b>`).
    replace(new RegExp(`${domain}/setpassword/${key}\\?createAccount=true`, 'g'), htmlLink).
    replace(new RegExp('https://www.uwazi.io', 'g'), '<a href="https://www.uwazi.io">https://www.uwazi.io</a>').
    replace(/\n{2,}/g, '</p><p>').
    replace(/\n/g, '<br />')
    }</p>`;
  }

  return response;
};

const sendAccountLockedEmail = (user, domain) => {
  const url = `${domain}/unlockaccount/${user.username}/${user.accountUnlockCode}`;
  const htmlLink = `<a href="${url}">${url}</a>`;
  const text =
  'Hello,\n\n' +
  'Your account has been locked because of too many failed login attempts. ' +
  'To unlock your account open the following link:\n' +
  `${url}`;
  const html = `<p>${
  text.replace(url, htmlLink)
  }</p>`;

  const mailOptions = {
    from: '"Uwazi" <no-reply@uwazi.io',
    to: user.email,
    subject: 'Account locked',
    text,
    html };


  return _mailer.default.send(mailOptions);
};var _default =

{
  async save(user, currentUser) {
    const [userInTheDatabase] = await _usersModel.default.get({ _id: user._id }, '+password');

    if (user._id === currentUser._id.toString() && user.role !== currentUser.role) {
      return Promise.reject((0, _utils.createError)('Can not change your own role', 403));
    }

    if (user.hasOwnProperty('role') && user.role !== userInTheDatabase.role && currentUser.role !== 'admin') {
      return Promise.reject((0, _utils.createError)('Unauthorized', 403));
    }

    return _usersModel.default.save(_objectSpread({},
    user, {
      password: user.password ? await (0, _encryptPassword.default)(user.password) : userInTheDatabase.password }));

  },

  newUser(user, domain) {
    return Promise.all([
    _usersModel.default.get({ username: user.username }),
    _usersModel.default.get({ email: user.email })]).

    then(async ([userNameMatch, emailMatch]) => {
      if (userNameMatch.length) {
        return Promise.reject((0, _utils.createError)('Username already exists', 409));
      }

      if (emailMatch.length) {
        return Promise.reject((0, _utils.createError)('Email already exists', 409));
      }

      return _usersModel.default.save(_objectSpread({}, user, { password: await (0, _encryptPassword.default)((0, _uniqueID.default)()) })).
      then(_user => this.recoverPassword(user.email, domain, { newUser: true }).then(() => _user));
    });
  },

  get(query, select) {
    return _usersModel.default.get(query, select);
  },

  getById(id) {
    return _usersModel.default.getById(id);
  },

  delete(_id, currentUser) {
    if (_id === currentUser._id.toString()) {
      return Promise.reject((0, _utils.createError)('Can not delete yourself', 403));
    }

    return _usersModel.default.count().
    then(count => {
      if (count > 1) {
        return _usersModel.default.delete({ _id });
      }

      return Promise.reject((0, _utils.createError)('Can not delete last user', 403));
    });
  },
  async login({ username, password }, domain) {
    const [user] = await this.get({ username }, '+password +accountLocked +failedLogins +accountUnlockCode');
    if (!user) {
      throw (0, _utils.createError)('Invalid username or password', 401);
    }
    if (user.accountLocked) {
      throw (0, _utils.createError)('Account locked. Check your email to unlock.', 403);
    }

    const passwordValidated = await (0, _encryptPassword.comparePasswords)(password, user.password);
    const oldPasswordValidated = user.password === (0, _sha.default)(password).toString();

    if (oldPasswordValidated) {
      await _usersModel.default.save({ _id: user._id, password: await (0, _encryptPassword.default)(password) });
    }

    if (!oldPasswordValidated && !passwordValidated) {
      const updatedUser = await _usersModel.default.db.findOneAndUpdate({ _id: user._id },
      { $inc: { failedLogins: 1 } }, { new: true, fields: '+failedLogins' });
      if (updatedUser.failedLogins >= MAX_FAILED_LOGIN_ATTEMPTS) {
        const accountUnlockCode = generateUnlockCode();
        const lockedUser = await _usersModel.default.db.findOneAndUpdate({ _id: user._id }, { $set: { accountLocked: true, accountUnlockCode } },
        { new: true, fields: '+accountUnlockCode' });
        await sendAccountLockedEmail(lockedUser, domain);
        throw (0, _utils.createError)('Account locked. Check your email to unlock.', 403);
      }
      throw (0, _utils.createError)('Invalid username or password', 401);
    }
    await _usersModel.default.db.updateOne({ _id: user._id }, { $unset: { failedLogins: 1 } });
    delete user.password;
    delete user.accountLocked;
    delete user.failedLogins;
    delete user.accountUnlockCode;
    return user;
  },
  async unlockAccount({ username, code }) {
    const [user] = await _usersModel.default.get({ username, accountUnlockCode: code }, '_id');

    if (!user) {
      throw (0, _utils.createError)('Invalid username or unlock code', 403);
    }

    return _usersModel.default.save(_objectSpread({}, user, { accountLocked: false, accountUnlockCode: false, failedLogins: false }));
  },
  recoverPassword(email, domain, options = {}) {
    const key = (0, _sha.default)(email + Date.now()).toString();
    return Promise.all([
    _usersModel.default.get({ email }),
    _settings2.default.get()]).

    then(([_user, _settings]) => {
      const user = _user[0];
      if (user) {
        return _passwordRecoveriesModel.default.save({ key, user: user._id }).
        then(() => {
          const mailOptions = { from: '"Uwazi" <no-reply@uwazi.io>', to: email };
          const mailTexts = conformRecoverText(options, _settings, domain, key, user);
          mailOptions.subject = mailTexts.subject;
          mailOptions.text = mailTexts.text;

          if (options.newUser) {
            mailOptions.html = mailTexts.html;
          }

          return _mailer.default.send(mailOptions);
        });
      }

      return Promise.reject((0, _utils.createError)('User not found', 403));
    });
  },

  async resetPassword(credentials) {
    const [key] = await _passwordRecoveriesModel.default.get({ key: credentials.key });
    if (key) {
      return Promise.all([
      _passwordRecoveriesModel.default.delete(key._id),
      _usersModel.default.save({ _id: key.user, password: await (0, _encryptPassword.default)(credentials.password) })]);

    }
    throw (0, _utils.createError)('key not found', 403);
  } };exports.default = _default;