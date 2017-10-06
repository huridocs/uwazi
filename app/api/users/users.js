import SHA256 from 'crypto-js/sha256';
import mailer from '../utils/mailer';
import random from 'shared/uniqueID';

import model from './usersModel';
import settings from '../settings/settings';
import passwordRecoveriesModel from './passwordRecoveriesModel';
import {createError} from 'api/utils';

const encryptPassword = password => SHA256(password).toString();

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
                 `${domain}/setpassword/${key}?createAcount=true\n\n` +
                 'For more information about the Uwazi platform, visit https://www.uwazi.io.\n\nThank you!\nUwazi team';

    const htmlLink = `<a href="${domain}/setpassword/${key}?createAcount=true">${domain}/setpassword/${key}?createAcount=true</a>`;

    response.subject = `Welcome to ${siteName}`;
    response.text = text;
    response.html = '<p>' +
                    response.text
                    .replace(new RegExp(user.username, 'g'), `<b>${user.username}</b>`)
                    .replace(new RegExp(`${domain}/setpassword/${key}\\?createAcount=true`, 'g'), htmlLink)
                    .replace(new RegExp('https://www.uwazi.io', 'g'), '<a href="https://www.uwazi.io">https://www.uwazi.io</a>')
                    .replace(/\n{2,}/g, '</p><p>')
                    .replace(/\n/g, '<br />') +
                    '</p>';
  }

  return response;
};

export default {
  save(user, currentUser) {
    return model.get({_id: user._id})
    .then(([userInTheDatabase]) => {
      if (user.hasOwnProperty('password') && user._id && user._id !== currentUser._id.toString()) {
        return Promise.reject(createError('Can not change other user password', 403));
      }

      if (user._id === currentUser._id.toString() && user.role !== currentUser.role) {
        return Promise.reject(createError('Can not change your own role', 403));
      }

      if (user.hasOwnProperty('role') && user.role !== userInTheDatabase.role && currentUser.role !== 'admin') {
        return Promise.reject(createError('Unauthorized', 403));
      }

      if (user.hasOwnProperty('password')) {
        user.password = encryptPassword(user.password);
      }

      return model.save(user);
    });
  },

  newUser(user, domain) {
    return Promise.all([
      model.get({username: user.username}),
      model.get({email: user.email})
    ])
    .then(([userNameMatch, emailMatch]) => {
      if (userNameMatch.length) {
        return Promise.reject(createError('Username already exists', 409));
      }

      if (emailMatch.length) {
        return Promise.reject(createError('Email already exists', 409));
      }

      user.password = encryptPassword(random());

      return model.save(user)
      .then((_user) => {
        this.recoverPassword(user.email, domain, {newUser: true});
        return _user;
      });
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
        return model.delete({_id});
      }

      return Promise.reject(createError('Can not delete last user', 403));
    });
  },

  recoverPassword(email, domain, options = {}) {
    let key = SHA256(email + Date.now()).toString();
    return Promise.all([
      model.get({email}),
      settings.get()
    ])
    .then(([_user, _settings]) => {
      const user = _user[0];
      if (user) {
        return passwordRecoveriesModel.save({key, user: user._id})
        .then(() => {
          let mailOptions = {from: '"Uwazi" <no-reply@uwazi.io>', to: email};
          const mailTexts = conformRecoverText(options, _settings, domain, key, user);
          mailOptions.subject = mailTexts.subject;
          mailOptions.text = mailTexts.text;

          if (options.newUser) {
            mailOptions.html = mailTexts.html;
          }

          return mailer.send(mailOptions);
        });
      }

      return 'userNotFound';
    });
  },

  resetPassword(credentials) {
    return passwordRecoveriesModel.get({key: credentials.key})
    .then((response) => {
      if (response.length) {
        return Promise.all([
          passwordRecoveriesModel.delete(response[0]._id),
          model.save({_id: response[0].user, password: encryptPassword(credentials.password)})
        ]);
      }
    });
  }
};
