import request from '../../shared/JSONRequest';
import {APIURL} from '../config.js';
import {browserHistory} from 'react-router';
import {notify} from 'app/Notifications/actions/notificationsActions';
import {store} from 'app/store';

let authorization;

let handleError = (error) => {
  if (error.status === 401) {
    browserHistory.replace('/login');
  }

  store.dispatch(notify('An error has occurred', 'warning'));
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
