"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _path = _interopRequireDefault(require("path"));
var _zipFile = _interopRequireDefault(require("../utils/zipFile"));
var _files = require("../utils/files");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const matchJson = entry => _path.default.extname(entry.fileName) === '.json';
const matchVideo = entry => _path.default.extname(entry.fileName) === '.mp4';
const matchScreenshot = entry => _path.default.extname(entry.fileName) === '.png';

const parseJson = (json, evidence) => {
  if (json) {
    return JSON.parse(json);
  }
  return { title: evidence.request };
};

const createFile = async (stream, evidence, extension) => {
  if (stream) {
    await (0, _files.fileFromReadStream)(`${evidence.request}.${extension}`, stream);
  }
};

const evidencePackage = (filePath, evidence) => {
  const zip = (0, _zipFile.default)(filePath);

  return {
    async json() {
      const jsonContent = await zip.getFileContent(matchJson);
      return parseJson(jsonContent, evidence);
    },

    async video() {
      const video = await zip.findReadStream(matchVideo);
      await createFile(video, evidence, 'mp4');
      return video;
    },

    async screenshot() {
      const screenshot = await zip.findReadStream(matchScreenshot);
      await createFile(screenshot, evidence, 'png');
      return screenshot;
    },

    async evidences() {
      return [await this.json(), await this.video(), await this.screenshot()];
    } };

};var _default =

evidencePackage;exports.default = _default;