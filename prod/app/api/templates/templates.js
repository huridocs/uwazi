"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _entities = _interopRequireDefault(require("../entities"));
var _JSONRequest = _interopRequireDefault(require("../../shared/JSONRequest.js"));
var _translations = _interopRequireDefault(require("../i18n/translations"));
var _validateTemplate = _interopRequireDefault(require("./validateTemplate"));
var _Error = _interopRequireDefault(require("../utils/Error"));

var _database = require("../config/database.js");
var _utils = require("./utils");
var _templatesModel = _interopRequireDefault(require("./templatesModel.js"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function ownKeys(object, enumerableOnly) {var keys = Object.keys(object);if (Object.getOwnPropertySymbols) {keys.push.apply(keys, Object.getOwnPropertySymbols(object));}if (enumerableOnly) keys = keys.filter(function (sym) {return Object.getOwnPropertyDescriptor(object, sym).enumerable;});return keys;}function _objectSpread(target) {for (var i = 1; i < arguments.length; i++) {if (i % 2) {var source = arguments[i] != null ? arguments[i] : {};ownKeys(source, true).forEach(function (key) {_defineProperty(target, key, source[key]);});} else if (Object.getOwnPropertyDescriptors) {Object.defineProperties(target, Object.getOwnPropertyDescriptors(arguments[i]));} else {ownKeys(source).forEach(function (key) {Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(arguments[i], key));});}}return target;}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}

const checkDuplicated = template => _templatesModel.default.get().
then(templates => {
  const duplicated = templates.find(entry => {
    const sameEntity = entry._id.equals(template._id);
    const sameName = entry.name.trim().toLowerCase() === template.name.trim().toLowerCase();
    return sameName && !sameEntity;
  });

  if (duplicated) {
    return Promise.reject({ json: 'duplicated_entry' });
  }
});

const removePropsWithUnexistentId = async unexistentId => {
  const relatedTemplates = await _templatesModel.default.get({ 'properties.content': unexistentId });
  await Promise.all(
  relatedTemplates.map((t) =>
  _templatesModel.default.save(_objectSpread({},
  t, {
    properties: t.properties.filter(prop => prop.content !== unexistentId) }))));



};

const createTranslationContext = template => {
  const titleProperty = template.commonProperties.find(p => p.name === 'title');
  const context = template.properties.reduce((ctx, prop) => {
    ctx[prop.label] = prop.label;
    return ctx;
  }, {});
  context[template.name] = template.name;
  context[titleProperty.label] = titleProperty.label;
  return context;
};

const addTemplateTranslation = template => {
  const context = createTranslationContext(template);
  return _translations.default.addContext(template._id, template.name, context, 'Entity');
};

const updateTranslation = (currentTemplate, template) => {
  const currentProperties = currentTemplate.properties;
  const newProperties = template.properties;
  const updatedLabels = (0, _utils.getUpdatedNames)(currentProperties, newProperties, 'label');
  if (currentTemplate.name !== template.name) {
    updatedLabels[currentTemplate.name] = template.name;
  }
  const deletedPropertiesByLabel = (0, _utils.getDeletedProperties)(currentProperties, newProperties, 'label');
  const context = createTranslationContext(template);

  return _translations.default.updateContext(currentTemplate._id, template.name, updatedLabels, deletedPropertiesByLabel, context, 'Entity');
};var _default =

{
  save(template, language) {
    template.properties = template.properties || [];
    template.properties = (0, _utils.generateNamesAndIds)(template.properties);
    return checkDuplicated(template).
    then(() => (0, _validateTemplate.default)(template)).
    then(() => {
      if (template._id) {
        return this._update(template, language);
      }
      return _templatesModel.default.save(template).
      then(newTemplate => addTemplateTranslation(newTemplate).
      then(() => newTemplate));
    });
  },

  _update(template, language) {
    let _currentTemplate;
    return this.getById(template._id).
    then(currentTemplate => {
      currentTemplate.properties = currentTemplate.properties || [];
      currentTemplate.properties.forEach(prop => {
        const swapingNameWithExistingProperty = template.properties.find(p => p.name === prop.name && p.id !== prop.id);
        if (swapingNameWithExistingProperty) {
          throw (0, _Error.default)(`Properties can't swap names: ${prop.name}`, 400);
        }
      });

      return currentTemplate;
    }).
    then(currentTemplate => Promise.all([currentTemplate, updateTranslation(currentTemplate, template)])).
    then(([currentTemplate]) => {
      _currentTemplate = currentTemplate;
      const currentTemplateContentProperties = currentTemplate.properties.filter(p => p.content);
      const templateContentProperties = template.properties.filter(p => p.content);
      const toRemoveValues = {};
      currentTemplateContentProperties.forEach(prop => {
        const sameProperty = templateContentProperties.find(p => p.id === prop.id);
        if (sameProperty && sameProperty.content !== prop.content) {
          toRemoveValues[sameProperty.name] = prop.type === 'multiselect' ? [] : '';
        }
      });
      if (Object.keys(toRemoveValues).length === 0) {
        return;
      }
      return _entities.default.removeValuesFromEntities(toRemoveValues, currentTemplate._id);
    }).

    then(() => _templatesModel.default.save(template)).
    then(savedTemplate => _entities.default.updateMetadataProperties(template, _currentTemplate, language).
    then(() => savedTemplate));
  },

  get(query) {
    return _templatesModel.default.get(query);
  },

  setAsDefault(templateId) {
    return this.get().
    then(_templates => {
      const templateToBeDefault = _templates.find(t => t._id.toString() === templateId);
      const currentDefault = _templates.find(t => t.default);
      templateToBeDefault.default = true;
      let saveCurrentDefault = Promise.resolve();
      if (currentDefault) {
        currentDefault.default = false;
        saveCurrentDefault = this.save(currentDefault);
      }
      return Promise.all([this.save(templateToBeDefault), saveCurrentDefault]);
    });
  },

  getById(templateId) {
    return _templatesModel.default.getById(templateId);
  },

  async delete(template) {
    const count = await this.countByTemplate(template._id);
    if (count > 0) {
      return Promise.reject({ key: 'documents_using_template', value: count });
    }
    await _translations.default.deleteContext(template._id);
    await removePropsWithUnexistentId(template._id);
    await _templatesModel.default.delete(template._id);

    return template;
  },

  countByTemplate(template) {
    return _entities.default.countByTemplate(template);
  },

  getEntitySelectNames(templateId) {
    return this.getById(templateId).
    then(template => {
      const selects = template.properties.filter(prop => prop.type === 'select' || prop.type === 'multiselect');
      const entitySelects = [];
      return Promise.all(selects.map(select => _JSONRequest.default.get(`${_database.db_url}/${select.content}`).
      then(result => {
        if (result.json.type === 'template') {
          entitySelects.push(select.name);
        }
      }))).
      then(() => entitySelects);
    });
  },

  countByThesauri(thesauriId) {
    return _templatesModel.default.count({ 'properties.content': thesauriId });
  } };exports.default = _default;