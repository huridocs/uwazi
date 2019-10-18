"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.translateEntity = exports.importEntity = void 0;var _entities = _interopRequireDefault(require("../entities"));
var _entitiesModel = _interopRequireDefault(require("../entities/entitiesModel"));
var _uploadProcess = _interopRequireDefault(require("../upload/uploadProcess"));
var _typeParsers = _interopRequireDefault(require("./typeParsers"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function ownKeys(object, enumerableOnly) {var keys = Object.keys(object);if (Object.getOwnPropertySymbols) {keys.push.apply(keys, Object.getOwnPropertySymbols(object));}if (enumerableOnly) keys = keys.filter(function (sym) {return Object.getOwnPropertyDescriptor(object, sym).enumerable;});return keys;}function _objectSpread(target) {for (var i = 1; i < arguments.length; i++) {if (i % 2) {var source = arguments[i] != null ? arguments[i] : {};ownKeys(source, true).forEach(function (key) {_defineProperty(target, key, source[key]);});} else if (Object.getOwnPropertyDescriptors) {Object.defineProperties(target, Object.getOwnPropertyDescriptors(arguments[i]));} else {ownKeys(source).forEach(function (key) {Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(arguments[i], key));});}}return target;}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}

const toMetadata = async (template, entityToImport) =>
template.properties.
filter(prop => entityToImport[prop.name]).
reduce(
async (meta, prop) => _objectSpread({}, (
await meta), {
  [prop.name]: _typeParsers.default[prop.type] ?
  await _typeParsers.default[prop.type](entityToImport, prop) :
  await _typeParsers.default.default(entityToImport, prop) }),

Promise.resolve({}));


const currentEntityIdentifiers = async (sharedId, language) =>
sharedId ?
_entities.default.get({ sharedId, language }, '_id sharedId').then(([e]) => e) :
{};

const entityObject = async (rawEntity, template, { language }) => _objectSpread({
  title: rawEntity.title,
  template: template._id,
  metadata: await toMetadata(template, rawEntity) }, (
await currentEntityIdentifiers(rawEntity.id, language)));


const importEntity = async (rawEntity, template, importFile, { user = {}, language }) => {
  const entity = await _entities.default.save((
  await entityObject(rawEntity, template, { user, language })),
  { user, language }, true, false);


  if (rawEntity.file) {
    const file = await importFile.extractFile(rawEntity.file);
    const docs = await _entities.default.get({ sharedId: entity.sharedId });
    await (0, _uploadProcess.default)(docs, file).start();
  }

  await _entities.default.indexEntities({ sharedId: entity.sharedId }, '+fullText');
  return entity;
};exports.importEntity = importEntity;

const translateEntity = async (entity, translations, template, importFile) => {
  await _entitiesModel.default.save((await Promise.all(
  translations.map(translatedEntity => entityObject(_objectSpread({},
  translatedEntity, { id: entity.sharedId }),
  template,
  { language: translatedEntity.language })))));



  await Promise.all(
  translations.map(async translatedEntity => {
    if (translatedEntity.file) {
      const file = await importFile.extractFile(translatedEntity.file);
      const docs = await _entities.default.get({ sharedId: entity.sharedId, language: translatedEntity.language });
      await (0, _uploadProcess.default)(docs, file).start();
    }
  }));


  await _entities.default.indexEntities({ sharedId: entity.sharedId }, '+fullText');
};exports.translateEntity = translateEntity;