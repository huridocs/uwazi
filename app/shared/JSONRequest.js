/** @format */

import 'isomorphic-fetch';
import superagent from 'superagent';
import { URLSearchParams } from 'url';

import rison from 'rison';

let cookie;

const attemptRisonDecode = string => {
  const errcb = e => {
    throw Error(`rison decoder error: ${e}`);
  };

  const risonParser = new rison.parser(errcb); // eslint-disable-line new-cap
  risonParser.error = message => {
    this.message = message;
  };

  risonParser.parse(string);
};

export function toUrlParams(_data) {
  const data = Object.assign({}, _data);
  if (!data || Object.keys(data).length === 0) {
    return '';
  }

  return `?${Object.keys(data)
    .map(key => {
      if (typeof data[key] === 'undefined' || data[key] === null) {
        return;
      }

      if (typeof data[key] === 'object') {
        data[key] = JSON.stringify(data[key]);
      }

      let encodedValue = encodeURIComponent(data[key]);

      if (encodeURIComponent(key) === 'q') {
        try {
          attemptRisonDecode(data[key]);
          encodedValue = data[key];
        } catch (err) {
          encodedValue = encodeURIComponent(data[key]);
        }
      }
      return `${encodeURIComponent(key)}=${encodedValue}`;
    })
    .filter(param => param)
    .join('&')}`;
}

const _fetch = (url, data, method, _headers) => {
  let response;
  let params = '';
  let body;

  const headers = Object.assign(
    {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      Cookie: cookie,
    },
    _headers
  );

  if (method === 'GET' || method === 'DELETE') {
    params = toUrlParams(data);
  }

  if (method === 'POST' || method === 'PUT') {
    body = JSON.stringify(data);
  }

  if (URLSearchParams && data instanceof URLSearchParams) {
    body = data;
  }

  return fetch(url + params, {
    method,
    headers,
    credentials: 'same-origin',
    body,
  })
    .then(res => {
      let setCookie;
      if (res.headers.get('set-cookie')) {
        setCookie = res.headers.get('set-cookie');
      }
      response = res;
      return Promise.all([res.json(), setCookie]);
    })
    .then(([json, setCookie]) => {
      const processedResponse = {
        json,
        status: response.status,
        cookie: setCookie,
      };

      if (response.status > 399) {
        throw processedResponse;
      }

      return processedResponse;
    });
};

export default {
  post: (url, data, headers) => _fetch(url, data, 'POST', headers),

  put: (url, data, headers) => _fetch(url, data, 'PUT', headers),

  get: (url, data, headers) => _fetch(url, data, 'GET', headers),

  delete: (url, data, headers) => _fetch(url, data, 'DELETE', headers),

  uploadFile: (url, filename, file) =>
    new Promise((resolve, reject) => {
      superagent
        .post(url)
        .set('Accept', 'application/json')
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('Cookie', cookie || '')
        .attach('file', file, filename)
        .then(() => {
          resolve();
        })
        .catch(err => {
          reject(err);
        });
    }),

  cookie: c => {
    cookie = c;
  },
};
