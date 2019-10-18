"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _entities = _interopRequireDefault(require("../../entities"));
var _filters = require("../../utils/filters");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const relationship = async (entityToImport, templateProperty) => {
  const values = entityToImport[templateProperty.name].split('|').
  filter(_filters.emptyString).
  filter(_filters.unique);

  const current = await _entities.default.get({ title: { $in: values } });
  const newValues = values.filter(v => !current.map(c => c.title).includes(v));

  await newValues.reduce(
  async (promise, title) => {
    await promise;
    return _entities.default.save({
      title,
      template: templateProperty.content },

    {
      language: 'en',
      user: {} });


  },
  Promise.resolve([]));


  const toRelateEntities = await _entities.default.get({ title: { $in: values } });
  return toRelateEntities.map(e => e.sharedId).filter((id, index, ids) => ids.indexOf(id) === index);
};var _default =

relationship;exports.default = _default;