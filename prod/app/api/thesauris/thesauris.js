"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _utils = require("../templates/utils");
var _entities = _interopRequireDefault(require("../entities/entities"));
var _templates = _interopRequireDefault(require("../templates/templates"));
var _translations = _interopRequireDefault(require("../i18n/translations"));
var _dictionariesModel = _interopRequireDefault(require("./dictionariesModel"));
var _validateThesauri = require("./validateThesauri");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function ownKeys(object, enumerableOnly) {var keys = Object.keys(object);if (Object.getOwnPropertySymbols) {keys.push.apply(keys, Object.getOwnPropertySymbols(object));}if (enumerableOnly) keys = keys.filter(function (sym) {return Object.getOwnPropertyDescriptor(object, sym).enumerable;});return keys;}function _objectSpread(target) {for (var i = 1; i < arguments.length; i++) {if (i % 2) {var source = arguments[i] != null ? arguments[i] : {};ownKeys(source, true).forEach(function (key) {_defineProperty(target, key, source[key]);});} else if (Object.getOwnPropertyDescriptors) {Object.defineProperties(target, Object.getOwnPropertyDescriptors(arguments[i]));} else {ownKeys(source).forEach(function (key) {Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(arguments[i], key));});}}return target;}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}

const autoincrementValuesId = thesauri => {
  thesauri.values = (0, _utils.generateIds)(thesauri.values);

  thesauri.values = thesauri.values.map(value => {
    if (value.values) {
      value.values = (0, _utils.generateIds)(value.values);
    }

    return value;
  });
  return thesauri;
};

function thesauriToTranslatioNContext(thesauri) {
  return thesauri.values.reduce((ctx, prop) => {
    ctx[prop.label] = prop.label;
    if (prop.values) {
      const propctx = prop.values.reduce((_ctx, val) => {
        _ctx[val.label] = val.label;
        return _ctx;
      }, {});
      ctx = Object.assign(ctx, propctx);
    }
    return ctx;
  }, {});
}

const create = async thesauri => {
  const context = thesauriToTranslatioNContext(thesauri);
  context[thesauri.name] = thesauri.name;

  const created = await _dictionariesModel.default.save(thesauri);
  await _translations.default.addContext(created._id, thesauri.name, context, 'Dictionary');
  return created;
};

const updateTranslation = (current, thesauri) => {
  const currentProperties = current.values;
  const newProperties = thesauri.values;

  const updatedLabels = (0, _utils.getUpdatedNames)(currentProperties, newProperties, 'label');
  if (current.name !== thesauri.name) {
    updatedLabels[current.name] = thesauri.name;
  }
  const deletedPropertiesByLabel = (0, _utils.getDeletedProperties)(currentProperties, newProperties, 'label');
  const context = thesauriToTranslatioNContext(thesauri);

  context[thesauri.name] = thesauri.name;
  return _translations.default.updateContext(current._id, thesauri.name, updatedLabels, deletedPropertiesByLabel, context, 'Dictionary');
};

const removeDeletedOptionsFromEntities = (current, thesauri) => {
  const currentProperties = current.values;
  const newProperties = thesauri.values;
  const deletedPropertiesById = (0, _utils.getDeletedProperties)(
  currentProperties,
  newProperties,
  'id');

  return Promise.all(
  deletedPropertiesById.map(deletedId => _entities.default.deleteEntityFromMetadata(deletedId, thesauri._id)));

};

const update = async thesauri => {
  const currentThesauri = await _dictionariesModel.default.getById(thesauri._id);
  await updateTranslation(currentThesauri, thesauri);
  await removeDeletedOptionsFromEntities(currentThesauri, thesauri);
  return _dictionariesModel.default.save(thesauri);
};var _default =

{
  async save(t) {
    const thesauri = _objectSpread({ values: [], type: 'thesauri' }, t);

    autoincrementValuesId(thesauri);

    await (0, _validateThesauri.validateThesauri)(thesauri);

    if (thesauri._id) {
      return update(thesauri);
    }
    return create(thesauri);
  },

  templateToThesauri(template, language, user) {
    const onlyPublished = !user;
    return _entities.default.getByTemplate(template._id, language, onlyPublished).
    then(response => {
      template.values = response.map(entity => ({
        id: entity.sharedId,
        label: entity.title,
        icon: entity.icon,
        type: entity.file ? 'document' : 'entity' }));

      template.type = 'template';
      return template;
    });
  },

  getById(id) {
    return _dictionariesModel.default.getById(id);
  },

  get(thesauriId, language, user) {
    let query;
    if (thesauriId) {
      query = { _id: thesauriId };
    }
    return Promise.all([
    _dictionariesModel.default.get(query),
    _templates.default.get(query)]).

    then(([dictionaries, allTemplates]) => {
      const processTemplates = Promise.all(allTemplates.map(
      result => this.templateToThesauri(result, language, user).
      then(templateTransformedInThesauri => templateTransformedInThesauri)));


      return processTemplates.then(processedTemplates => dictionaries.concat(processedTemplates));
    });
  },

  dictionaries(query) {
    return _dictionariesModel.default.get(query);
  },

  delete(id) {
    return _templates.default.countByThesauri(id).
    then(count => {
      if (count) {
        return Promise.reject({ key: 'templates_using_dictionary', value: count });
      }
      return _translations.default.deleteContext(id);
    }).
    then(() => _dictionariesModel.default.delete(id)).
    then(() => ({ ok: true }));
  } };exports.default = _default;