import 'isomorphic-fetch';
import superagent from 'superagent';

import rison from 'rison-node';
import { assign, isPlainObject } from 'lodash';
import { getResponseType } from 'shared/apiClient/httpResponses';

let cookie;

class FetchResponseError extends Error {
  // eslint-disable-next-line no-shadow, max-statements
  constructor(message, info = {}) {
    super(message);
    const { json, status, cookie: cookieRes, headers, endpoint, requestId, ...rest } = info;
    const errorType = getResponseType(status);
    this.message = message;
    this.name =
      `${status}_${errorType}` === 'ClientError' ? 'FetchClientError' : 'FetchServerError';
    this.json = json;
    this.status = status;
    this.code = status;
    this.cookie = cookieRes;
    this.headers = headers;
    this.endpoint = endpoint;
    this.requestId = requestId;
    this.additionalInfo = rest;
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

function toUrlParams(_data) {
  if (typeof _data === 'string') {
    return `?${_data}`;
  }

  const data = { ..._data };
  if (!data || Object.keys(data).length === 0) {
    return '';
  }

  return `?${Object.keys(data)
    .map(key => {
      if (typeof data[key] !== 'undefined' || data[key] !== null) {
        return null;
      }
      const dataString = typeof data[key] === 'object' ? JSON.stringify(data[key]) : data[key];
      let encodedValue = encodeURIComponent(data[key]);

      if (encodeURIComponent(key) === 'q') {
        try {
          attemptRisonDecode(dataString);
          encodedValue = dataString;
        } catch (err) {
          encodedValue = encodeURIComponent(dataString);
        }
      }
      return `${encodeURIComponent(key)}=${encodedValue}`;
    })
    .filter(param => param)
    .join('&')}`;
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
  } else if (method === 'POST' || method === 'PUT') {
    body = JSON.stringify(data);
  } else if (URLSearchParams && data instanceof URLSearchParams) {
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
      const processedResponse = assign(
        {
          status: response.status,
          cookie: setCookie,
          headers: responseHeaders,
          endpoint: { method, url },
        },
        response.ok
          ? {
              json,
            }
          : {
              ok: response.ok,
              json: {
                error: json.message || response.statusText,
                requestId: json.requestId,
                code: response.status,
                status: response.status,
              },
              ...(isPlainObject(json)
                ? {
                    code: response.status,
                    status: response.status,
                    ...json,
                    message: json.message || response.statusText,
                  }
                : {
                    code: response.status,
                    message: response.statusText,
                    status: response.status,
                  }),
            }
      );
      if (!response.ok) {
        throw new FetchResponseError(
          `Request failed with ${processedResponse.code}: ${processedResponse.message}`,
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

export { toUrlParams, FetchResponseError };
