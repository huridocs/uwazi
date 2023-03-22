import 'isomorphic-fetch';
import superagent from 'superagent';

import rison from 'rison-node';

let cookie;

class FetchResponseError extends Error {
  // eslint-disable-next-line no-shadow
  constructor(message, { json, status, cookie, headers } = {}) {
    super(message);
    this.name = 'FetchResponseError';
    this.json = json;
    this.status = status;
    this.cookie = cookie;
    this.headers = headers;
  }
}

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
  let risonData = undefined;
  if (typeof _data === 'string') {
    return `?${_data}`;
  }

  const data = { ..._data };
  if (!data || Object.keys(data).length === 0) {
    return '';
  }

  if (data['q']) {
    risonData = data['q'];
    try {
      attemptRisonDecode(risonData);
    } catch (err) {
      risonData = encodeURIComponent(risonData);
    }
  }
  const query = new URLSearchParams();

  Object.keys(data).forEach(key => {
    if (typeof data[key] === 'undefined' || data[key] === null || key === 'q') {
      return;
    }
    if (Array.isArray(data[key])) {
      data[key].forEach(value => {
        query.append(key, value);
      });
      return;
    }

    if (typeof data[key] === 'object') {
      query.set(key, JSON.stringify(data[key]));
      return;
    }

    query.set(key, data[key]);
  });

  const queryString = query.toString();

  return '?' + queryString + (typeof risonData !== 'undefined' ? `&q=${risonData}` : '');
}

const removeUndefinedKeys = obj => {
  //eslint-disable-next-line no-param-reassign
  Object.keys(obj).forEach(key => (obj[key] === undefined ? delete obj[key] : {}));
};

const _fetch = (url, data, method, _headers) => {
  let response;
  let params = '';
  let body;

  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    Cookie: cookie,
    ..._headers,
  };

  if (method === 'GET' || method === 'DELETE') {
    params = toUrlParams(data);
  }

  if (method === 'POST' || method === 'PUT') {
    body = JSON.stringify(data);
  }

  if (URLSearchParams && data instanceof URLSearchParams) {
    body = data;
  }

  removeUndefinedKeys(headers);

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
      // Failed .json() parsing usually indicates a non-success http status,
      // so we rather return that failure status than throw our own parsin
      // error.
      return Promise.all([res.json().catch(() => ({})), setCookie, res.headers]);
    })
    .then(([json, setCookie, responseHeaders]) => {
      const processedResponse = {
        json,
        status: response.status,
        cookie: setCookie,
        headers: responseHeaders,
      };

      if (response.status > 399) {
        throw new FetchResponseError(
          `Fetch returned a response with status ${response.status}.`,
          processedResponse
        );
      }

      return processedResponse;
    });
};

export default {
  post: (url, data, headers) => _fetch(url, data, 'POST', headers),

  put: (url, data, headers) => _fetch(url, data, 'PUT', headers),

  get: (url, data, headers) => _fetch(url, data, 'GET', headers),

  delete: (url, data, headers) => _fetch(url, data, 'DELETE', headers),

  head: (url, data, headers) => _fetch(url, data, 'HEAD', headers),

  // TEST!!!!! Fully untested function
  uploadFile: (url, filename, file, _cookie) =>
    new Promise((resolve, reject) => {
      superagent
        .post(url)
        .set('Accept', 'application/json')
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('Cookie', _cookie || cookie || '')
        .attach('file', file, filename)
        .then(response => {
          resolve(response);
        })
        .catch(err => {
          reject(err);
        });
    }),

  cookie: c => {
    cookie = c;
  },
};

export { FetchResponseError };
