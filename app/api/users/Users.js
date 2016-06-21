import {db_url as dbURL} from '../config/database.js';
import request from 'shared/JSONRequest.js';
import SHA256 from 'crypto-js/sha256';

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
  }
};
