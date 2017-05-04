import SHA256 from 'crypto-js/sha256';
import mailer from '../utils/mailer';

import model from './usersModel';
import passwordRecoveriesModel from './passwordRecoveriesModel';

export default {
  update(user) {
    if (user.password) {
      user.password = SHA256(user.password).toString();
    }

    return model.save(user);
  },

  get(query, select) {
    return model.get(query, select);
  },

  getById(id) {
    return model.getById(id);
  },

  delete(_id) {
    return model.delete({_id});
  },

  recoverPassword(email, domain) {
    let key = SHA256(email + Date.now()).toString();
    return model.get({email})
    .then((results) => {
      const user = results[0];
      if (user) {
        return passwordRecoveriesModel.save({key, user: user._id})
        .then(() => {
          let mailOptions = {
            from: '"Uwazi" <no-reply@uwazi.com>',
            to: email,
            subject: 'Password recovery',
            text: `To reset your password click the following link:\n${domain}/resetpassword/${key}`
          };
          mailer.send(mailOptions);
        });
      }
    });
  },

  resetPassword(credentials) {
    return passwordRecoveriesModel.get({key: credentials.key})
    .then((response) => {
      if (response.length) {
        return Promise.all([
          passwordRecoveriesModel.delete(response[0]._id),
          this.update({_id: response[0].user, password: credentials.password})
        ]);
      }
    });
  }
};
