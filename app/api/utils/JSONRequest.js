import fetch from 'isomorphic-fetch';

let _fetch = (url, data, method) => {
  return fetch(url, {
    method: method,
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(data)
  })
  .then((response) => response.json());
}

export default {
  post: (url, data) => {
    return _fetch(url, data, 'POST');
  },

  get: (url, data) => {
    return _fetch(url, data, 'GET');
  },

  delete: (url, data) => {
    return _fetch(url, data, 'DELETE');
  }
}
