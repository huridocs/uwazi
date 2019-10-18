"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _relationships = _interopRequireDefault(require("../relationships/relationships"));
var _translations = _interopRequireDefault(require("../i18n/translations"));

var _utils = require("../templates/utils");
var _model = _interopRequireDefault(require("./model"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const checkDuplicated = relationtype => _model.default.get().
then(response => {
  const duplicated = response.find(entry => {
    const sameEntity = entry._id.equals(relationtype._id);
    const sameName = entry.name.trim().toLowerCase() === relationtype.name.trim().toLowerCase();
    return sameName && !sameEntity;
  });

  if (duplicated) {
    return Promise.reject('duplicated_entry');
  }
});

function _save(relationtype) {
  const values = {};
  values[relationtype.name] = relationtype.name;
  relationtype.properties.forEach(property => {
    values[property.label] = property.label;
  });
  return _model.default.save(relationtype).
  then(response => _translations.default.addContext(response._id, relationtype.name, values, 'Connection').
  then(() => response));
}

const updateTranslation = (currentTemplate, template) => {
  const currentProperties = currentTemplate.properties;
  const newProperties = template.properties;

  const updatedLabels = (0, _utils.getUpdatedNames)(currentProperties, newProperties, 'label');
  if (currentTemplate.name !== template.name) {
    updatedLabels[currentTemplate.name] = template.name;
  }
  const deletedPropertiesByLabel = (0, _utils.getDeletedProperties)(currentProperties, newProperties, 'label');
  const context = template.properties.reduce((ctx, prop) => {
    ctx[prop.label] = prop.label;
    return ctx;
  }, {});

  context[template.name] = template.name;

  return _translations.default.updateContext(currentTemplate._id, template.name, updatedLabels, deletedPropertiesByLabel, context, 'Connection');
};

function _update(newTemplate) {
  return _model.default.getById({ _id: newTemplate._id }).
  then(currentTemplate => {
    updateTranslation(currentTemplate, newTemplate);
    _relationships.default.updateMetadataProperties(newTemplate, currentTemplate);
    return _model.default.save(newTemplate);
  });
}var _default =

{
  get(query) {
    return _model.default.get(query);
  },

  getById(id) {
    return _model.default.getById(id);
  },

  save(relationtype) {
    relationtype.properties = (0, _utils.generateNamesAndIds)(relationtype.properties || []);

    return checkDuplicated(relationtype).
    then(() => {
      if (!relationtype._id) {
        return _save(relationtype);
      }
      return _update(relationtype);
    });
  },

  delete(id) {
    return _relationships.default.countByRelationType(id).
    then(relationshipsUsingIt => {
      if (relationshipsUsingIt === 0) {
        return _translations.default.deleteContext(id).
        then(() => _model.default.delete(id)).
        then(() => true);
      }

      return false;
    });
  } };exports.default = _default;