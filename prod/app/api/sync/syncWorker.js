"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;require("../entities");

var _urlJoin = _interopRequireDefault(require("url-join"));

var _handleError = require("../utils/handleError");
var _errorLog = _interopRequireDefault(require("../log/errorLog"));
var _JSONRequest = _interopRequireDefault(require("../../shared/JSONRequest"));
var _settings = _interopRequireDefault(require("../settings"));
var _synchronizer = _interopRequireDefault(require("./synchronizer"));
var _syncConfig = _interopRequireDefault(require("./syncConfig"));
var _syncsModel = _interopRequireDefault(require("./syncsModel"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const timeout = async interval => new Promise(resolve => {
  setTimeout(resolve, interval);
});var _default =

{
  stopped: false,

  async syncronize({ url, config: _config }) {
    const config = await (0, _syncConfig.default)(_config);

    const { lastSync } = config;

    const lastChanges = await config.lastChanges();

    await lastChanges.reduce(async (prev, change) => {
      await prev;

      if (change.deleted) {
        return _synchronizer.default.syncData(url, 'delete', change, { _id: change.mongoId });
      }

      const data = await config.shouldSync(change);
      if (data) {
        return _synchronizer.default.syncData(url, 'post', change, data, lastSync);
      }

      return Promise.resolve();
    }, Promise.resolve());
  },

  async intervalSync(config, interval = 5000) {
    if (this.stopped) {
      return;
    }
    try {
      await this.syncronize(config);
    } catch (e) {
      if (e.status === 401) {
        await this.login(config.url, config.username, config.password);
      } else {
        _errorLog.default.error((0, _handleError.prettifyError)(e).prettyMessage);
      }
    }
    await timeout(interval);
    await this.intervalSync(config, interval);
  },

  async login(url, username, password) {
    try {
      const response = await _JSONRequest.default.post((0, _urlJoin.default)(url, 'api/login'), { username, password });
      _JSONRequest.default.cookie(response.cookie);
    } catch (e) {
      _errorLog.default.error((0, _handleError.prettifyError)(e).prettyMessage);
    }
  },

  async start(interval) {
    const { sync } = await _settings.default.get();
    if (sync && sync.active) {
      const syncs = await _syncsModel.default.find();
      if (syncs.length === 0) {
        await _syncsModel.default.create({ lastSync: 0 });
      }
      this.intervalSync(sync, interval);
    }
  },

  stop() {
    this.stopped = true;
  } };exports.default = _default;