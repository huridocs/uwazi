"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _utils = require("../utils");
var _nprogress = _interopRequireDefault(require("nprogress"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const loadingProgressBar = {
  requests: 0,

  start: () => {
    if (_utils.isClient) {
      _nprogress.default.configure({ showSpinner: false, easing: 'ease', speed: 800, minimum: 0.2 });
      _nprogress.default.start();
      loadingProgressBar.requests += 1;
    }
  },

  done: () => {
    if (_utils.isClient && _nprogress.default) {
      loadingProgressBar.requests -= 1;
      if (loadingProgressBar.requests <= 0) {
        _nprogress.default.done();
        return;
      }

      _nprogress.default.inc(0.1);
    }
  } };var _default =


loadingProgressBar;exports.default = _default;