import 'isomorphic-fetch';

let _fetch = (url, data, method, cookie) => {

  let response;

  let headers = { 'Accept': 'application/json', 'Content-Type': 'application/json' };
  headers.Cookie = cookie;

  return fetch(url, {
    method: method,
    headers: headers,
    credentials: 'same-origin',
    body: JSON.stringify(data)
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
    return _fetch(url, data, 'GET', cookie);
  },

  delete: (url, data) => {
    return _fetch(url, data, 'DELETE');
  }
}
