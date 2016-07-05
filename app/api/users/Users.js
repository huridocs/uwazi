import {db_url as dbURL} from '../config/database.js';
import request from 'shared/JSONRequest.js';
import SHA256 from 'crypto-js/sha256';
import mailer from 'api/utils/mailer';

export default {
  update(userProperties) {
    if (userProperties.password) {
      userProperties.password = SHA256(userProperties.password).toString();
    }

    return request.get(`${dbURL}/${userProperties._id}`)
    .then((user) => {
      return request.post(dbURL, Object.assign(user.json, userProperties));
    })
    .then((response) => {
      return response.json;
    });
  },

  recoverPassword(email) {
    let key = SHA256(email + Date.now()).toString();
    return request.get(`${dbURL}/_design/users/_view/all`)
    .then((results) => {
      let user = results.json.rows.find((row) => row.value.email === email);
      if (user) {
        return request.post(`${dbURL}`, {key, user: user.id, type: 'recoverpassword'})
        .then(() => {
          let mailOptions = {
            from: '"Uwazi" <no-reply@uwazi.com>',
            to: email,
            subject: 'Password recovery',
            text: `To reset your password click the following link:\nhttp://localhost:3000/resetpassword/${key}`
          };
          mailer.send(mailOptions);
        });
      }
    });
  },

  resetPassword(credentials) {
    return request.get(`${dbURL}/_design/recoverpassword/_view/all?key="${credentials.key}"`)
    .then((response) => {
      if (response.json.rows.length) {
        request.delete(`${dbURL}/${response.json.rows[0].id}`, {rev: response.json.rows[0].value._rev});
        return this.update({_id: response.json.rows[0].value.user, password: credentials.password});
      }
    });
  }
};
