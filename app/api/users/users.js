import SHA256 from 'crypto-js/sha256';
import crypto from 'crypto';

import { createError } from 'api/utils';
import random from 'shared/uniqueID';
import encryptPassword from 'api/auth/encryptPassword';

import mailer from '../utils/mailer';
import model from './usersModel';
import passwordRecoveriesModel from './passwordRecoveriesModel';
import settings from '../settings/settings';
import usersModel from './usersModel';

const encryptPassword = password => SHA256(password).toString();

const verifyPassword = (plain, hashed) => encryptPassword(plain) === hashed;

const generateUnlockCode = () => crypto.randomBytes(32).toString('hex');

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
      response.text
      .replace(new RegExp(user.username, 'g'), `<b>${user.username}</b>`)
      .replace(new RegExp(`${domain}/setpassword/${key}\\?createAccount=true`, 'g'), htmlLink)
      .replace(new RegExp('https://www.uwazi.io', 'g'), '<a href="https://www.uwazi.io">https://www.uwazi.io</a>')
      .replace(/\n{2,}/g, '</p><p>')
      .replace(/\n/g, '<br />')
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
    html
  };

  return mailer.send(mailOptions);
};

export default {
  encryptPassword,
  save(user, currentUser) {
    return model.get({ _id: user._id })
    .then(async ([userInTheDatabase]) => {
      if (user._id === currentUser._id.toString() && user.role !== currentUser.role) {
        return Promise.reject(createError('Can not change your own role', 403));
      }

      if (user.hasOwnProperty('role') && user.role !== userInTheDatabase.role && currentUser.role !== 'admin') {
        return Promise.reject(createError('Unauthorized', 403));
      }

      return model.save({
        ...user,
        password: user.password ? await encryptPassword(user.password) : undefined,
      });
    });
  },

  newUser(user, domain) {
    return Promise.all([
      model.get({ username: user.username }),
      model.get({ email: user.email })
    ])
    .then(async ([userNameMatch, emailMatch]) => {
      if (userNameMatch.length) {
        return Promise.reject(createError('Username already exists', 409));
      }

      if (emailMatch.length) {
        return Promise.reject(createError('Email already exists', 409));
      }

      return model.save({ ...user, password: await encryptPassword(random()) })
      .then(_user => this.recoverPassword(user.email, domain, { newUser: true }).then(() => _user));
    });
  },

  get(query, select) {
    return model.get(query, select);
  },

  getById(id) {
    return model.getById(id);
  },

  delete(_id, currentUser) {
    if (_id === currentUser._id.toString()) {
      return Promise.reject(createError('Can not delete yourself', 403));
    }

    return model.count()
    .then((count) => {
      if (count > 1) {
        return model.delete({ _id });
      }

      return Promise.reject(createError('Can not delete last user', 403));
    });
  },
  async login({ username, password }, domain) {
    const [user] = await this.get({ username }, '+password +accountLocked +failedLogins +accountUnlockCode');
    if (!user) {
      throw createError('Invalid username or password', 401);
    }
    if (user.accountLocked) {
      throw createError('Account locked. Check your email to unlock.', 403);
    }

    if (!verifyPassword(password, user.password)) {
      const updatedUser = await usersModel.db.findOneAndUpdate({ _id: user._id },
          { $inc: { failedLogins: 1 } }, { new: true, fields: '+failedLogins' });
      if (updatedUser.failedLogins >= 3) {
        const accountUnlockCode = generateUnlockCode();
        const lockedUser = await usersModel.db.findOneAndUpdate({ _id: user._id }, { $set: { accountLocked: true, accountUnlockCode } },
          { new: true, fields: '+accountUnlockCode' });
        await sendAccountLockedEmail(lockedUser, domain);
        throw createError('Account locked. Check your email to unlock.', 403);
      }
      throw createError('Invalid username or password', 401);
    }
    await usersModel.db.updateOne({ _id: user._id }, { $unset: { failedLogins: 1 } });
    delete user.password;
    delete user.accountLocked;
    delete user.failedLogins;
    delete user.accountUnlockCode;
    return user;
  },
  async unlockAccount({ username, code }) {
    const user = await usersModel.db.findOneAndUpdate({ username, accountUnlockCode: code, accountLocked: true }, {
      $unset: { accountLocked: 1, accountUnlockCode: 1, failedLogins: 1 }
    });
    if (!user) {
      throw createError('Invalid username or unlock code', 403);
    }
  },
  recoverPassword(email, domain, options = {}) {
    const key = SHA256(email + Date.now()).toString();
    return Promise.all([
      model.get({ email }),
      settings.get()
    ])
    .then(([_user, _settings]) => {
      const user = _user[0];
      if (user) {
        return passwordRecoveriesModel.save({ key, user: user._id })
        .then(() => {
          const mailOptions = { from: '"Uwazi" <no-reply@uwazi.io>', to: email };
          const mailTexts = conformRecoverText(options, _settings, domain, key, user);
          mailOptions.subject = mailTexts.subject;
          mailOptions.text = mailTexts.text;

          if (options.newUser) {
            mailOptions.html = mailTexts.html;
          }

          return mailer.send(mailOptions);
        });
      }

      return Promise.reject(createError('User not found', 403));
    });
  },

  async resetPassword(credentials) {
    const [key] = await passwordRecoveriesModel.get({ key: credentials.key });
    if (key) {
      return Promise.all([
        passwordRecoveriesModel.delete(key._id),
        model.save({ _id: key.user, password: await encryptPassword(credentials.password) })
      ]);
    }
    throw createError('key not found', 403);
  }
};
