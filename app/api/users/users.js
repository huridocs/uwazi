import SHA256 from 'crypto-js/sha256';
import crypto from 'crypto';

import { createError } from 'api/utils';
import random from 'shared/uniqueID';
import encryptPassword, { comparePasswords } from 'api/auth/encryptPassword';
import * as usersUtils from 'api/auth2fa/usersUtils';

import {
  getByMemberIdList,
  updateUserMemberships,
  removeUsersFromAllGroups,
} from 'api/usergroups/userGroupsMembers';
import mailer from '../utils/mailer';
import model from './usersModel';
import passwordRecoveriesModel from './passwordRecoveriesModel';
import settings from '../settings/settings';

const MAX_FAILED_LOGIN_ATTEMPTS = 6;

const generateUnlockCode = () => crypto.randomBytes(32).toString('hex');

function conformRecoverText(options, _settings, domain, key, user) {
  const response = {};
  if (!options.newUser) {
    response.subject = 'Password set';
    response.text = `To set your password click on the following link:\n${domain}/setpassword/${key}`;
  }

  if (options.newUser) {
    const siteName = _settings.site_name || 'Uwazi';
    const text =
      'Hello!\n\n' +
      `The administrators of ${siteName} have created an account for you under the user name:\n` +
      `${user.username}\n\n` +
      'To complete this process, please create a strong password by clicking on the following link:\n' +
      `${domain}/setpassword/${key}?createAccount=true\n\n` +
      'For more information about the Uwazi platform, visit https://www.uwazi.io.\n\nThank you!\nUwazi team';

    const htmlLink = `<a href="${domain}/setpassword/${key}?createAccount=true">${domain}/setpassword/${key}?createAccount=true</a>`;

    response.subject = `Welcome to ${siteName}`;
    response.text = text;
    response.html = `<p>${response.text
      .replace(new RegExp(user.username, 'g'), `<b>${user.username}</b>`)
      .replace(new RegExp(`${domain}/setpassword/${key}\\?createAccount=true`, 'g'), htmlLink)
      .replace(/https:\/\/www.uwazi.io/g, '<a href="https://www.uwazi.io">https://www.uwazi.io</a>')
      .replace(/\n{2,}/g, '</p><p>')
      .replace(/\n/g, '<br />')}</p>`;
  }
  return response;
}

const sendAccountLockedEmail = async (user, domain) => {
  const url = `${domain}/unlockaccount/${user.username}/${user.accountUnlockCode}`;
  const htmlLink = `<a href="${url}">${url}</a>`;
  const text =
    'Hello,\n\n' +
    'Your account has been locked because of too many failed login attempts. ' +
    'To unlock your account open the following link:\n' +
    `${url}`;
  const html = `<p>${text.replace(url, htmlLink)}</p>`;

  const settingsDetails = await settings.get();
  const emailSender = mailer.createSenderDetails(settingsDetails);
  const mailOptions = {
    from: emailSender,
    to: user.email,
    subject: 'Account locked',
    text,
    html,
  };

  return mailer.send(mailOptions);
};

const validateUserStatus = user => {
  if (!user) {
    throw createError('Invalid username or password', 401);
  }
  if (user.accountLocked) {
    throw createError('Account locked. Check your email to unlock.', 403);
  }
};

const updateOldPassword = async (user, password) => {
  await model.save({ _id: user._id, password: await encryptPassword(password) });
};

const blockAccount = async (user, domain) => {
  const accountUnlockCode = generateUnlockCode();
  const lockedUser = await model.db.findOneAndUpdate(
    { _id: user._id },
    { $set: { accountLocked: true, accountUnlockCode } },
    { new: true, fields: '+accountUnlockCode' }
  );
  await sendAccountLockedEmail(lockedUser, domain);
};

const newFailedLogin = async (user, domain) => {
  const updatedUser = await model.db.findOneAndUpdate(
    { _id: user._id },
    { $inc: { failedLogins: 1 } },
    { new: true, fields: '+failedLogins' }
  );
  if (updatedUser.failedLogins >= MAX_FAILED_LOGIN_ATTEMPTS) {
    await blockAccount(user, domain);
    throw createError('Account locked. Check your email to unlock.', 403);
  }
};

const validateUserPassword = async (user, password, domain) => {
  const passwordValidated = await comparePasswords(password, user.password);
  const oldPasswordValidated = user.password === SHA256(password).toString();

  if (oldPasswordValidated) {
    await updateOldPassword(user, password);
  }

  if (!oldPasswordValidated && !passwordValidated) {
    await newFailedLogin(user, domain);
    throw createError('Invalid username or password', 401);
  }
};

const validate2fa = async (user, token, domain) => {
  if (user.using2fa) {
    if (!token) {
      throw createError('Two-step verification token required', 409);
    }

    try {
      await usersUtils.verifyToken(user, token);
    } catch (err) {
      await newFailedLogin(user, domain);
      throw err;
    }
  }
};

const sanitizeUser = user => {
  const { password, accountLocked, failedLogins, accountUnlockCode, ...sanitizedUser } = user;
  return sanitizedUser;
};

const populateGroupsOfUsers = async (user, groups) => {
  const memberships = groups
    .filter(group => group.members.find(member => member.refId === user._id.toString()))
    .map(group => ({
      _id: group._id,
      name: group.name,
    }));
  return { ...user, groups: memberships };
};

function unauthorizedAction(user, userInTheDatabase, currentUser) {
  return (
    (user.hasOwnProperty('role') &&
      user.role !== userInTheDatabase.role &&
      currentUser.role !== 'admin') ||
    (user._id !== currentUser._id.toString() && currentUser.role !== 'admin')
  );
}

export default {
  async save(user, currentUser) {
    const [userInTheDatabase] = await model.get({ _id: user._id }, '+password');

    if (unauthorizedAction(user, userInTheDatabase, currentUser)) {
      return Promise.reject(createError('Unauthorized', 403));
    }

    if (user._id === currentUser._id.toString() && user.role !== currentUser.role) {
      return Promise.reject(createError('Can not change your own role', 403));
    }

    if (user.username && user.username.includes(' ')) {
      return Promise.reject(createError('Usernames can not contain spaces.', 400));
    }

    const { using2fa, secret, ...userToSave } = user;

    const updatedUser = await model.save({
      ...userToSave,
      password: user.password ? await encryptPassword(user.password) : userInTheDatabase.password,
    });

    if (currentUser.role === 'admin' && user.groups) {
      await updateUserMemberships(updatedUser, user.groups);
    }

    return updatedUser;
  },

  async newUser(user, domain) {
    const [userNameMatch, emailMatch] = await Promise.all([
      model.get({ username: user.username }),
      model.get({ email: user.email }),
    ]);
    if (user.username && user.username.includes(' ')) {
      return Promise.reject(createError('Usernames can not contain spaces.', 400));
    }
    if (userNameMatch.length || emailMatch.length) {
      const message = userNameMatch.length ? 'Username already exists' : 'Email already exists';
      return Promise.reject(createError(message, 409));
    }
    const password = user.password ? user.password : random();
    const _user = await model.save({
      ...user,
      password: await encryptPassword(password),
      using2fa: undefined,
      secret: undefined,
    });
    if (user.groups && user.groups.length > 0) {
      await updateUserMemberships(_user, user.groups);
    }
    await this.recoverPassword(user.email, domain, { newUser: true });
    return _user;
  },

  async get(query, select) {
    const users = await model.get(query, select);
    if (typeof select === 'string' && select.includes('+groups')) {
      const userIds = users.map(user => user._id.toString());
      const groups = await getByMemberIdList(userIds);
      return Promise.all(users.map(user => populateGroupsOfUsers(user, groups)));
    }
    return users;
  },

  async getById(id, select = '', includeGroups = false) {
    const user = await model.getById(id, select);
    if (includeGroups && user) {
      const groups = await getByMemberIdList([user._id.toString()]);
      return populateGroupsOfUsers(user, groups);
    }
    return user;
  },

  async delete(_ids, currentUser) {
    const ids = _ids.map(id => id.toString());
    if (_ids.find(id => id.toString() === currentUser._id.toString())) {
      return Promise.reject(createError('Can not delete yourself', 403));
    }

    const count = await model.count();
    if (count > _ids.length) {
      await removeUsersFromAllGroups(ids);
      return model.delete({ _id: { $in: _ids } });
    }
    return Promise.reject(createError('Can not delete last user(s).', 403));
  },

  async login({ username, password, token }, domain) {
    const [user] = await this.get(
      { username },
      '+password +accountLocked +failedLogins +accountUnlockCode'
    );

    validateUserStatus(user);
    await validateUserPassword(user, password, domain);
    await validate2fa(user, token, domain);
    await model.db.updateOne({ _id: user._id }, { $unset: { failedLogins: 1 } });

    return sanitizeUser(user);
  },

  async unlockAccount({ username, code }) {
    const [user] = await model.get({ username, accountUnlockCode: code }, '_id');

    if (!user) {
      throw createError('Invalid username or unlock code', 403);
    }

    return model.save({
      ...user,
      accountLocked: false,
      accountUnlockCode: false,
      failedLogins: false,
    });
  },

  async simpleUnlock(_id) {
    await model.updateMany(
      { _id },
      { $unset: { accountLocked: 1, accountUnlockCode: 1, failedLogins: 1 } }
    );
  },

  recoverPassword(email, domain, options = {}) {
    const key = SHA256(email + Date.now()).toString();
    return Promise.all([model.get({ email }), settings.get()]).then(([_user, _settings]) => {
      const user = _user[0];
      if (user) {
        return passwordRecoveriesModel.save({ key, user: user._id }).then(() => {
          const emailSender = mailer.createSenderDetails(_settings);
          const mailOptions = { from: emailSender, to: email };
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
        model
          .save({ _id: key.user, password: await encryptPassword(credentials.password) })
          .then(() => this.simpleUnlock({ _id: key.user })),
      ]);
    }
    throw createError('key not found', 403);
  },
};
