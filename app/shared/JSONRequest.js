import 'isomorphic-fetch';
import rison from 'rison';

const attemptRisonDecode = (string) => {
  const errcb = function (e) {
    throw Error(`rison decoder error: ${e}`);
  };

  const risonParser = new rison.parser(errcb); // eslint-disable-line new-cap
  risonParser.error = function (message) {
    this.message = message;
  };

  risonParser.parse(string);
};

export function toUrlParams(_data) {
  const data = Object.assign({}, _data);
  if (!data || Object.keys(data).length === 0) {
    return '';
  }

  return `?${Object.keys(data).map((key) => {
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
  }).filter(param => param).join('&')}`;
}

const _fetch = (url, data, method, _headers) => {
  let response;
  let params = '';
  let body;

  const headers = Object.assign({
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }, _headers);

  if (method === 'GET' || method === 'DELETE') {
    params = toUrlParams(data);
  }

  if (method === 'POST' || method === 'PUT') {
    body = JSON.stringify(data);
  }

  return fetch(url + params, {
    method,
    headers,
    credentials: 'same-origin',
    body
  })
  .then((res) => {
    response = res;
    return res.json();
  })
  .then((json) => {
    const procesedResponse = {
      json,
      status: response.status
    };

    if (response.status > 399) {
      throw procesedResponse;
    }

    return procesedResponse;
  });
};

export default {
  post: (url, data, headers) => _fetch(url, data, 'POST', headers),

  put: (url, data, headers) => _fetch(url, data, 'PUT', headers),

  get: (url, data, headers) => _fetch(url, data, 'GET', headers),

  delete: (url, data) => _fetch(url, data, 'DELETE')
};
