import 'isomorphic-fetch';

function toParams(data) {
  if (!data || Object.keys(data).length === 0) {
    return '';
  }
  return '?' + Object.keys(data).reduce((params, key) => {
    params.push(encodeURIComponent(key) + '=' + encodeURIComponent(data[key] || ''));
    return params;
  }, []).join('&');
}

let _fetch = (url, data, method, cookie) => {

  let response;

  let headers = { 'Accept': 'application/json', 'Content-Type': 'application/json' };
  headers.Cookie = cookie;

  let body;

  if (method !== 'GET') {
    body = JSON.stringify(data)
  }

  return fetch(url, {
    method: method,
    headers: headers,
    credentials: 'same-origin',
    body: body
  })
  .then((res) => {
    response = res;
    return res.json()
  })
  .then((json) => {
    let procesed_response = {
      json: json,
      status: response.status
    };

    if (response.status > 399){
      throw procesed_response;
    }

    return procesed_response;
  });
}

export default {
  post: (url, data) => {
    return _fetch(url, data, 'POST');
  },

  get: (url, data, cookie) => {
    let params = toParams(data);
    return _fetch(url + params, data, 'GET', cookie);
  },

  delete: (url, data) => {
    return _fetch(url, data, 'DELETE');
  }
}
