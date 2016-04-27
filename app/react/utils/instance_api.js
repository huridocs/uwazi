import request from '../../shared/JSONRequest';
import {APIURL} from '../config.js';

function toParams(data) {
  if (!data) {
    return '';
  }
  return '?' + Object.keys(data).reduce((params, key) => {
    params.push(encodeURIComponent(key) + '=' + encodeURIComponent(data[key] || ''));
    return params;
  }, []).join('&');
}

export default (cookie) => {
  return {
    get: (url, data) => {
      let params = toParams(data);
      return request.get(APIURL + url + params, data, cookie);
    },

    post: (url, data) => {
      return request.post(APIURL + url, data);
    },

    delete: (url, data) => {
      return request.delete(APIURL + url, data);
    }
  };
};
