import { browserHistory } from 'react-router';

import { isClient } from 'app/utils';
import { notify } from 'app/Notifications/actions/notificationsActions';
import { store } from 'app/store';
import loadingBar from 'app/App/LoadingProgressBar';

import { APIURL } from '../config.js';
import request from '../../shared/JSONRequest';

let cookie;
let locale;
let API_URL = APIURL;

const doneLoading = (data) => {
  loadingBar.done();
  return data;
};

const handleError = (e, endpoint) => {
  const error = e;
  error.endpoint = endpoint;

  if (!isClient) {
    return Promise.reject(error);
  }

  doneLoading();

  if (error.status === 401) {
    browserHistory.replace('/login');
  }

  if (error.status === 404) {
    browserHistory.replace('/404');
  }

  if (error.status === 500) {
    store.dispatch(notify('An error has occurred', 'danger'));
  }

  if (![500, 404, 401].includes(error.status)) {
    store.dispatch(notify(error.json.error, 'danger'));
  }

  return Promise.reject(error);
};

const _request = (url, data, method) => {
  loadingBar.start();
  return request[method](API_URL + url, data, { 'Content-language': locale, Cookie: cookie, 'X-Requested-With': 'XMLHttpRequest' })
  .then(doneLoading)
  .catch(e => handleError(e, { url, method }));
};

export default {
  get: (url, data) => _request(url, data, 'get'),

  post: (url, data) => _request(url, data, 'post'),

  delete: (url, data) => _request(url, data, 'delete'),

  cookie(c) {
    cookie = c;
  },

  locale(key) {
    locale = key;
  },

  APIURL(url) {
    API_URL = url;
  }
};
