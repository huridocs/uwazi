"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.mockVault = exports.createPackage = void 0;var _fetchMock = _interopRequireDefault(require("fetch-mock"));
var _path = _interopRequireDefault(require("path"));
var _yazl = _interopRequireDefault(require("yazl"));
var _fs = _interopRequireDefault(require("fs"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };} // eslint-disable-line

const createPackage = (data, fileName) =>
fileName ?
new Promise((resolve, reject) => {
  const zipfile = new _yazl.default.ZipFile();
  zipfile.outputStream.
  pipe(_fs.default.createWriteStream(_path.default.join(__dirname, `/zips/${fileName}`))).
  on('finish', resolve).
  on('error', reject);

  zipfile.addBuffer(Buffer.from(''), 'md5.csv');

  if (data) {
    zipfile.addBuffer(Buffer.from(data), 'data.json');
    zipfile.addBuffer(Buffer.from('this is a fake video'), 'video.mp4');
    zipfile.addBuffer(Buffer.from('this is a fake image'), 'screenshot.png');
  }
  zipfile.end();
}) : Promise.resolve();exports.createPackage = createPackage;

const mockVault = async evidences => {
  const response = evidences.map(e => e.listItem);

  _fetchMock.default.restore();

  _fetchMock.default.post((url, options) =>
  url === 'https://public.evidence-vault.org/list.php' &&
  options.body.get('token') === 'auth_token' &&
  options.headers['Content-Type'] === 'application/x-www-form-urlencoded',
  JSON.stringify(response));

  return Promise.all(evidences.map(async e => {
    if (e.listItem.filename) {
      await createPackage(JSON.stringify(e.jsonInfo), e.listItem.filename);
      const zipPackage = _fs.default.createReadStream(_path.default.join(__dirname, `zips/${e.listItem.filename}`));
      const zipResponse = new Response(
      zipPackage,
      { headers: { 'Content-Type': 'application/zip' } });

      _fetchMock.default.get(`https://public.evidence-vault.org//download/${e.listItem.filename}`, zipResponse);
    }
  }));
};exports.mockVault = mockVault;