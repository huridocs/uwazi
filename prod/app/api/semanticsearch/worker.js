"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _events = _interopRequireDefault(require("events"));
var _async = _interopRequireDefault(require("async"));
var _statuses = require("./statuses");
var _semanticSearch = _interopRequireDefault(require("./semanticSearch"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

class Worker extends _events.default {
  constructor(searchId, batchSize = 1) {
    super();
    this.searchId = searchId;
    this.batchSize = batchSize;
    this.done = false;
    this.stopped = false;
  }

  async processBatch() {
    const res = await _semanticSearch.default.processSearchLimit(this.searchId, this.batchSize);
    const { updatedSearch } = res;
    this.done = updatedSearch.status === _statuses.COMPLETED;
    this.stopped = updatedSearch.status === _statuses.STOPPED;
    this.emit('update', res);
  }

  start() {
    _async.default.whilst(
    () => !(this.done || this.stopped),
    cb => {
      this.processBatch().then(cb).catch(cb);
    },
    err => {
      if (err) {
        // eslint-disable-next-line
        err.message = `Semantic search ${this.searchId} error: ${err.message}`;
        this.emit('error', err);
      } else {
        if (this.done) {
          this.emit('done');
        }
        if (this.stopped) {
          this.emit('stopped');
        }
      }
    });

  }}var _default =


Worker;exports.default = _default;