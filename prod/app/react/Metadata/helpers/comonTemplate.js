"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _immutable = _interopRequireDefault(require("immutable"));
var _comonProperties = _interopRequireDefault(require("../../../shared/comonProperties"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var _default =

(templates, entities) => {
  const selectedTemplates = entities.map(entity => entity.get('template')).
  filter((type, index, _types) => _types.indexOf(type) === index);
  const properties = _comonProperties.default.comonProperties(templates, selectedTemplates);
  const _id = selectedTemplates.size === 1 ? selectedTemplates.first() : '';

  const withoutTemplate = entities.reduce((memo, entity) => memo && !entity.get('template'), true);

  if (withoutTemplate) {
    return _immutable.default.fromJS(templates.find(template => template.default));
  }
  return _immutable.default.fromJS({ _id, properties });
};exports.default = _default;