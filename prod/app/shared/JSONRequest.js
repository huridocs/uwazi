"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.toUrlParams = toUrlParams;exports.default = void 0;require("isomorphic-fetch");
var _superagent = _interopRequireDefault(require("superagent"));
var _url = require("url");

var _rison = _interopRequireDefault(require("rison"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _typeof(obj) {if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {_typeof = function (obj) {return typeof obj;};} else {_typeof = function (obj) {return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;};}return _typeof(obj);}

let cookie;

const attemptRisonDecode = string => {
  const errcb = e => {
    throw Error(`rison decoder error: ${e}`);
  };

  const risonParser = new _rison.default.parser(errcb); // eslint-disable-line new-cap
  risonParser.error = function (message) {
    this.message = message;
  };

  risonParser.parse(string);
};

function toUrlParams(_data) {
  const data = Object.assign({}, _data);
  if (!data || Object.keys(data).length === 0) {
    return '';
  }

  return `?${Object.keys(data).map(key => {
    if (typeof data[key] === 'undefined' || data[key] === null) {
      return;
    }

    if (_typeof(data[key]) === 'object') {
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
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    Cookie: cookie },
  _headers);

  if (method === 'GET' || method === 'DELETE') {
    params = toUrlParams(data);
  }

  if (method === 'POST' || method === 'PUT') {
    body = JSON.stringify(data);
  }

  if (_url.URLSearchParams && data instanceof _url.URLSearchParams) {
    body = data;
  }

  return fetch(url + params, {
    method,
    headers,
    credentials: 'same-origin',
    body }).

  then(res => {
    let setCookie;
    if (res.headers.get('set-cookie')) {
      setCookie = res.headers.get('set-cookie');
    }
    response = res;
    return Promise.all([res.json(), setCookie]);
  }).
  then(([json, setCookie]) => {
    const procesedResponse = {
      json,
      status: response.status,
      cookie: setCookie };


    if (response.status > 399) {
      throw procesedResponse;
    }

    return procesedResponse;
  });
};var _default =


{
  post: (url, data, headers) => _fetch(url, data, 'POST', headers),

  put: (url, data, headers) => _fetch(url, data, 'PUT', headers),

  get: (url, data, headers) => _fetch(url, data, 'GET', headers),

  delete: (url, data, headers) => _fetch(url, data, 'DELETE', headers),

  uploadFile: (url, filename, file) => new Promise((resolve, reject) => {
    _superagent.default.post(url).
    set('Accept', 'application/json').
    set('X-Requested-With', 'XMLHttpRequest').
    set('Cookie', cookie || '').
    attach('file', file, filename).
    then(() => {
      resolve();
    }).
    catch(err => {
      reject(err);
    });
  }),

  cookie: c => {
    cookie = c;
  } };exports.default = _default;