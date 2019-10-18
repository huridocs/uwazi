"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = create;exports.store = void 0;var _utils = require("./utils");
var _reduxThunk = _interopRequireDefault(require("redux-thunk"));
var _reduxDevtoolsExtension = require("redux-devtools-extension");

var _redux = require("redux");
var _reducer = _interopRequireDefault(require("./reducer"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const data = _utils.isClient && window.__reduxData__ ? window.__reduxData__ : {};
let store;exports.store = store;

function create(initialData = data) {
  exports.store = store = (0, _redux.createStore)(
  _reducer.default,
  initialData,
  (0, _reduxDevtoolsExtension.composeWithDevTools)(
  (0, _redux.applyMiddleware)(_reduxThunk.default)));



  return store;
}

if (module.hot) {
  if (!window.store) {
    window.store = create();
  }
  exports.store = store = window.store;
  module.hot.accept('./reducer', () => {
    const rootReducer = require("./reducer");
    store.replaceReducer(rootReducer);
  });
}

if (!store) {
  exports.store = store = create();
}