"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;const timeout = async interval => new Promise(resolve => {
  setTimeout(resolve, interval);
});var _default =

{
  stopped: false,

  async start(cb, interval) {
    if (!this.stopped) {
      await cb();
      await timeout(interval);
      await this.start(cb, interval);
    }
  },

  stop() {
    this.stopped = true;
  } };exports.default = _default;