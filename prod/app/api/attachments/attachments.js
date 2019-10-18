"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _entities = _interopRequireWildcard(require("../entities"));
var _fs = _interopRequireDefault(require("fs"));
var _path = _interopRequireDefault(require("path"));
var _relationships = _interopRequireDefault(require("../relationships"));

var _paths = _interopRequireDefault(require("../config/paths"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function ownKeys(object, enumerableOnly) {var keys = Object.keys(object);if (Object.getOwnPropertySymbols) {keys.push.apply(keys, Object.getOwnPropertySymbols(object));}if (enumerableOnly) keys = keys.filter(function (sym) {return Object.getOwnPropertyDescriptor(object, sym).enumerable;});return keys;}function _objectSpread(target) {for (var i = 1; i < arguments.length; i++) {if (i % 2) {var source = arguments[i] != null ? arguments[i] : {};ownKeys(source, true).forEach(function (key) {_defineProperty(target, key, source[key]);});} else if (Object.getOwnPropertyDescriptors) {Object.defineProperties(target, Object.getOwnPropertyDescriptors(arguments[i]));} else {ownKeys(source).forEach(function (key) {Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(arguments[i], key));});}}return target;}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}

const deleteFile = fileName => new Promise(resolve => {
  const filePath = _path.default.join(_paths.default.attachments, fileName);
  _fs.default.unlink(filePath, () => {
    resolve(filePath);
  });
});

const deleteTextReferences = async (id, language) => _relationships.default.deleteTextReferences(id, language);

const attachmentPresentOn = (siblings, attachment) => siblings.reduce((memo, sibling) => {
  if (sibling.attachments && sibling.attachments.find(a => a.filename === attachment.filename)) {
    return true;
  }
  return memo;
}, false);var _default =

{
  async delete(attachmentId) {
    let [entity] = await _entities.default.get({ 'attachments._id': attachmentId });
    let result;
    if (entity) {
      result = this.removeAttachment(entity, attachmentId);
    }

    entity = await _entities.default.getById(attachmentId);
    if (entity) {
      result = this.removeMainFile(entity, attachmentId);
    }

    return result;
  },

  async removeMainFile(entity) {
    const textReferencesDeletions = [];
    const deleteThumbnails = [];
    let siblings = await _entities.model.get({ sharedId: entity.sharedId, _id: { $ne: entity._id } });

    textReferencesDeletions.push(deleteTextReferences(entity.sharedId, entity.language));
    deleteThumbnails.push(deleteFile(`${entity._id}.jpg`));

    siblings = siblings.map(e => {
      textReferencesDeletions.push(deleteTextReferences(e.sharedId, e.language));
      deleteThumbnails.push(deleteFile(`${e._id}.jpg`));
      return _objectSpread({}, e, { file: null, toc: null });
    });

    const [[savedEntity]] = await Promise.all([
    _entities.default.saveMultiple([_objectSpread({}, entity, { file: null, toc: null })]),
    _entities.default.saveMultiple(siblings),
    textReferencesDeletions,
    deleteThumbnails,
    deleteFile(entity.file.filename)]);


    return savedEntity;
  },

  async removeAttachment(entity, attachmentId) {
    const siblings = await _entities.model.get({
      sharedId: entity.sharedId,
      _id: { $ne: entity._id } });


    const attachmentToDelete = entity.attachments.find(a => a._id.equals(attachmentId));


    const [savedEntity] = await _entities.default.saveMultiple([_objectSpread({},
    entity, {
      attachments: (entity.attachments || []).filter(a => !a._id.equals(attachmentId)) })]);


    const shouldUnlink = !attachmentPresentOn(siblings, attachmentToDelete);
    if (shouldUnlink) {
      await deleteFile(attachmentToDelete.filename);
    }

    return savedEntity;
  } };exports.default = _default;