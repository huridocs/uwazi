"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;require("isomorphic-fetch");
var _url = require("url");
var _JSONRequest = _interopRequireDefault(require("../../shared/JSONRequest"));
var _files = require("../utils/files");
var _evidencePackage = _interopRequireDefault(require("./evidencePackage"));

var _vaultEvidencesModel = _interopRequireDefault(require("./vaultEvidencesModel"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const vaultUrl = 'https://public.evidence-vault.org/';
const statusToProcess = ['201', '418'];

const vault = {
  async newEvidences(token) {
    const body = new _url.URLSearchParams();
    body.append('token', token);

    const evidencesTracked = (await _vaultEvidencesModel.default.get()).map(
    e => e.request);


    return _JSONRequest.default.
    post(`${vaultUrl}list.php`, body, {
      'Content-Type': 'application/x-www-form-urlencoded' }).

    then((res) =>
    res.json.
    filter(e => !evidencesTracked.includes(e.request)).
    filter(e => statusToProcess.includes(e.status)));

  },

  async downloadPackage(evidence) {
    const fileName = await (0, _files.fileFromReadStream)(
    `${evidence.request}.zip`,
    (await fetch(`${vaultUrl}/download/${evidence.filename}`)).body);


    return (0, _evidencePackage.default)(fileName, evidence);
  } };var _default =


vault;exports.default = _default;