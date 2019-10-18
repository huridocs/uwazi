"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;require("isomorphic-fetch");
var _mongoose = _interopRequireDefault(require("mongoose"));

var _templateTypes = require("../../shared/templateTypes");

var _entities = _interopRequireDefault(require("../entities"));
var _templates = _interopRequireDefault(require("../templates"));
var _date = _interopRequireDefault(require("../utils/date"));

var _vault = _interopRequireDefault(require("./vault"));
var _vaultEvidencesModel = _interopRequireDefault(require("./vaultEvidencesModel"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const linkProp = (template) =>
template.properties.find(p => p.type === _templateTypes.templateTypes.link).name;

const mediaProp = (template) =>
template.properties.find(p => p.type === _templateTypes.templateTypes.media).name;

const imageProp = (template) =>
template.properties.find(p => p.type === _templateTypes.templateTypes.image).name;

const dateProp = (template) =>
template.properties.find(p => p.type === _templateTypes.templateTypes.date).name;

const vaultSync = {
  async sync(token, templateId) {
    const evidences = await _vault.default.newEvidences(token);
    const template = await _templates.default.getById(templateId);

    return evidences.reduce(async (prev, evidence) => {
      await prev;
      const zipPackage = await _vault.default.downloadPackage(evidence);

      const [json, video, screenshot] = await zipPackage.evidences();

      const _id = _mongoose.default.Types.ObjectId();

      await _entities.default.save(
      {
        _id,
        title: json.title,
        metadata: {
          [linkProp(template)]: { label: evidence.url, url: evidence.url },
          [dateProp(template)]: _date.default.stringDateToUTCTimestamp(evidence.time_of_request),
          [mediaProp(template)]: video ?
          `/api/attachments/download?_id=${_id}&file=${evidence.request}.mp4` :
          '',
          [imageProp(template)]: screenshot ?
          `/api/attachments/download?_id=${_id}&file=${evidence.request}.png` :
          '' },

        template: templateId,
        attachments: [
        video && {
          filename: `${evidence.request}.mp4`,
          originalname: `${json.title}.mp4` },

        screenshot && {
          filename: `${evidence.request}.png`,
          originalname: `${json.title}.png` },

        {
          filename: `${evidence.request}.zip`,
          originalname: `${json.title}.zip` }].

        filter(a => a) },

      { language: 'en', user: {} });

      return _vaultEvidencesModel.default.save({ request: evidence.request });
    }, Promise.resolve());
  } };var _default =


vaultSync;exports.default = _default;