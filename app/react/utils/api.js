import request from '../../shared/JSONRequest';
import {isClient} from 'app/utils';
import {APIURL} from '../config.js';
import {browserHistory} from 'react-router';
import {notify} from 'app/Notifications/actions/notificationsActions';
import {store} from 'app/store';

let cookie;
let locale;

let handleError = (error) => {
  if (!isClient) {
    return Promise.reject(error);
  }

  if (error.status === 401) {
    browserHistory.replace('/login');
    return Promise.reject(error);
  }

  if (error.status === 404) {
    browserHistory.replace('/404');
    return Promise.reject(error);
  }

  if (error.status === 500) {
    store.dispatch(notify('An error has occurred', 'danger'));
    return Promise.reject(error);
  }

  store.dispatch(notify(error.json.error, 'danger'));
  return Promise.reject(error);
};

export default {
  get: (url, data) => {
    return request.get(APIURL + url, data, {'Content-language': locale, Cookie: cookie})
    .catch(handleError);
  },

  post: (url, data) => {
    return request.post(APIURL + url, data, {'Content-language': locale})
    .catch(handleError);
  },

  delete: (url, data) => {
    return request.delete(APIURL + url, data, {'Content-language': locale})
    .catch(handleError);
  },

  cookie(c) {
    cookie = c;
  },

  locale(key) {
    locale = key;
  }
};
