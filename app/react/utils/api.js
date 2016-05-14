import request from '../../shared/JSONRequest';
import {APIURL} from '../config.js';
import {browserHistory} from 'react-router';

let authorization;

export default {
  get: (url, data) => {
    return request.get(APIURL + url, data, authorization)
    .catch((error) => {
      if (error.status === 401) {
        browserHistory.replace('login', '/login');
      }

      return Promise.reject();
    });
  },

  post: (url, data) => {
    return request.post(APIURL + url, data)
    .catch((error) => {
      if (error.status === 401) {
        browserHistory.replace('login', '/login');
      }

      return Promise.reject();
    });
  },

  delete: (url, data) => {
    return request.delete(APIURL + url, data)
    .catch((error) => {
      if (error.status === 401) {
        browserHistory.replace('login', '/login');
      }

      return Promise.reject();
    });
  },

  authorize(auth) {
    authorization = auth;
  }
};
