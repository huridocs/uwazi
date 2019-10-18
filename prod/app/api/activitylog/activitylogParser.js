"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.getSemanticData = void 0;var _templates = _interopRequireDefault(require("../templates"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const methods = {
  create: 'CREATE',
  update: 'UPDATE',
  delete: 'DELETE' };


const entitiesPOST = async log => {
  const data = JSON.parse(log.body);
  const template = await _templates.default.getById(data.template);

  const semantic = {
    beautified: true,
    name: data.title,
    extra: `of type ${template ? template.name : `(${data.template ? data.template.toString() : 'unassigned'})`}` };


  if (data.sharedId) {
    semantic.name = `${data.title} (${data.sharedId})`;
    semantic.action = methods.update;
    semantic.description = 'Updated entity / document';
  } else {
    semantic.action = methods.create;
    semantic.description = 'Created entity / document';
  }

  return semantic;
};

const entitiesDELETE = async log => {
  const data = JSON.parse(log.query);

  const semantic = {
    beautified: true,
    action: methods.delete,
    description: 'Deleted entity / document',
    name: data.sharedId };


  return semantic;
};

const actions = {
  'POST/api/entities': entitiesPOST,
  'POST/api/documents': entitiesPOST,
  'DELETE/api/entities': entitiesDELETE,
  'DELETE/api/documents': entitiesDELETE };


const getSemanticData = async data => {
  if (actions[`${data.method}${data.url}`]) {
    return actions[`${data.method}${data.url}`](data);
  }

  return { beautified: false };
};exports.getSemanticData = getSemanticData;