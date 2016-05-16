import request from '../../shared/JSONRequest';
import {APIURL} from '../config.js';
import {browserHistory} from 'react-router';

let authorization;

let handleError = (error) => {
  if (error.status === 401) {
    browserHistory.replace('/login');
  }
  return Promise.reject();
};

export default {
  get: (url, data) => {
    return request.get(APIURL + url, data, authorization)
    .catch(handleError);
  },

  post: (url, data) => {
    return request.post(APIURL + url, data)
    .catch(handleError);
  },

  delete: (url, data) => {
    return request.delete(APIURL + url, data)
    .catch(handleError);
  },

  authorize(auth) {
    authorization = auth;
  }
};
