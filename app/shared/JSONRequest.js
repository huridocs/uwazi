import 'isomorphic-fetch';

function toParams(data) {
  if (!data || Object.keys(data).length === 0) {
    return '';
  }
  return '?' + Object.keys(data).reduce((params, key) => {
    let value = data[key] || '';
    if (typeof value === 'object') {
      value = JSON.stringify(value);
    }
    params.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
    return params;
  }, []).join('&');
}

let _fetch = (url, data, method, cookie) => {
  let response;
  let params = '';
  let body;

  let headers = {Accept: 'application/json', 'Content-Type': 'application/json'};
  headers.Cookie = cookie;

  if (method === 'GET' || method === 'DELETE') {
    params = toParams(data);
  }

  if (method === 'POST') {
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
  post: (url, data) => {
    return _fetch(url, data, 'POST');
  },

  get: (url, data, cookie) => {
    return _fetch(url, data, 'GET', cookie);
  },

  delete: (url, data) => {
    return _fetch(url, data, 'DELETE');
  }
};
