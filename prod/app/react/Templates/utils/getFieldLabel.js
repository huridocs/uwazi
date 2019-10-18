"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = getFieldLabel;var _I18N = require("../../I18N");

function getTitleLabel(template) {
  const titleField = template.commonProperties.find(p => p.name === 'title');
  return (0, _I18N.t)(template._id, titleField.label);
}

function getMetadataFieldLabel(field, template) {
  const name = field.split('.')[1];
  const property = template.properties.find(p => p.name === name);
  return property && (0, _I18N.t)(template._id, property.label) || field;
}

function getFieldLabel(field, template) {
  const _template = template && template.toJS ? template.toJS() : template;
  if (field === 'title') {
    return getTitleLabel(_template);
  }
  if (field.startsWith('metadata.') && _template) {
    return getMetadataFieldLabel(field, _template) || field;
  }
  return field;
}