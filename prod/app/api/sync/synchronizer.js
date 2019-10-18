"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _fs = _interopRequireDefault(require("fs"));
var _path = _interopRequireDefault(require("path"));
var _util = _interopRequireDefault(require("util"));
var _urlJoin = _interopRequireDefault(require("url-join"));

var _JSONRequest = _interopRequireDefault(require("../../shared/JSONRequest"));
var _paths = _interopRequireDefault(require("../config/paths"));

var _syncsModel = _interopRequireDefault(require("./syncsModel"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const oneSecond = 1000;
const readFile = _util.default.promisify(_fs.default.readFile);

const uploadFile = async (url, filename) => {
  const filepath = _path.default.join(_paths.default.uploadedDocuments, filename);
  const file = await readFile(filepath);
  return _JSONRequest.default.uploadFile((0, _urlJoin.default)(url, 'api/sync/upload'), filename, file);
};

const syncFiles = async (url, data, lastSync) => {
  if (data.file && data.file.timestamp >= lastSync - oneSecond) {
    await uploadFile(url, data.file.filename);

    const thumbnailFilename = `${data._id.toString()}.jpg`;
    await uploadFile(url, thumbnailFilename);
  }

  if (data.attachments && data.attachments.length) {
    await data.attachments.reduce(async (prev, attachment) => {
      await prev;
      if (attachment.timestamp >= lastSync - oneSecond) {
        await uploadFile(url, attachment.filename);
      }
      return Promise.resolve();
    }, Promise.resolve());
  }
};

const syncronizer = {
  async syncData(url, action, change, data, lastSync) {
    await _JSONRequest.default[action]((0, _urlJoin.default)(url, 'api/sync'), { namespace: change.namespace, data });
    await syncFiles(url, data, lastSync);
    return _syncsModel.default.updateMany({}, { $set: { lastSync: change.timestamp } });
  } };var _default =


syncronizer;exports.default = _default;