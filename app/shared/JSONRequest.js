import 'isomorphic-fetch';

export function toUrlParams(_data) {
  let data = Object.assign({}, _data);
  if (!data || Object.keys(data).length === 0) {
    return '';
  }
  return '?' + Object.keys(data).reduce((params, key) => {
    if (typeof data[key] === 'undefined' || data[key] === null) {
      return params;
    }

    if (typeof data[key] === 'object') {
      data[key] = JSON.stringify(data[key]);
    }
    params.push(encodeURIComponent(key) + '=' + encodeURIComponent(data[key]));
    return params;
  }, []).join('&');
}

let _fetch = (url, data, method, _headers) => {
  let response;
  let params = '';
  let body;

  let headers = Object.assign({
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
    method: method,
    headers: headers,
    credentials: 'same-origin',
    body: body
  })
  .then((res) => {
    response = res;
    return res.json();
  })
  .then((json) => {
    let procesedResponse = {
      json: json,
      status: response.status
    };

    if (response.status > 399) {
      throw procesedResponse;
    }

    return procesedResponse;
  });
};

export default {
  post: (url, data, headers) => {
    return _fetch(url, data, 'POST', headers);
  },

  put: (url, data, headers) => {
    return _fetch(url, data, 'PUT', headers);
  },

  get: (url, data, headers) => {
    return _fetch(url, data, 'GET', headers);
  },

  delete: (url, data) => {
    return _fetch(url, data, 'DELETE');
  }
};
