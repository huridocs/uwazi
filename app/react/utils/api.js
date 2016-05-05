import request from '../../shared/JSONRequest';
import {APIURL} from '../config.js';

let authorization;

export default {
  get: (url, data) => {
    return request.get(APIURL + url, data, authorization);
  },

  post: (url, data) => {
    return request.post(APIURL + url, data);
  },

  delete: (url, data) => {
    return request.delete(APIURL + url, data);
  },

  authorize(auth) {
    authorization = auth;
  }
};
