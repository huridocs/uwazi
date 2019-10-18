"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _entities = _interopRequireDefault(require("../entities/entities"));
var _elasticIndexes = _interopRequireDefault(require("../config/elasticIndexes"));
var _elastic = _interopRequireDefault(require("../search/elastic"));
var _elastic_mapping = _interopRequireDefault(require("../../../database/elastic_mapping"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var _default =

elasticIndex => {
  _elasticIndexes.default.index = elasticIndex;
  return {
    resetIndex() {
      return _elastic.default.indices.delete({ index: elasticIndex, ignore_unavailable: true }).
      then(() => _elastic.default.indices.create({
        index: elasticIndex,
        body: _elastic_mapping.default })).

      then(() => null);
    },
    reindex() {
      return this.resetIndex().
      then(() => _entities.default.indexEntities({}, '+fullText')).
      then(() => _elastic.default.indices.refresh({ index: elasticIndex })).
      then(() => null);
    },

    refresh() {
      return _elastic.default.indices.refresh({ index: elasticIndex });
    } };

};exports.default = _default;