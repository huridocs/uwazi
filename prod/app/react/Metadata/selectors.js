"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.metadataSelectors = void 0;var _reselect = require("reselect");

var _immutable = _interopRequireDefault(require("immutable"));
var _formater = _interopRequireDefault(require("./helpers/formater"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const indexValues = (t) =>
t.set('values', t.get('values').reduce((indexed, value) => {
  if (value.get('values')) {
    return indexed.merge(indexValues(value).get('values'));
  }
  return indexed.set(value.get('id'), value);
}, new _immutable.default.Map({})));

const indexedThesaurus = (0, _reselect.createSelector)(
s => s.thesauris,
thesaurus => thesaurus.map(t => indexValues(t)));


const formatMetadata = (0, _reselect.createSelector)(
s => s.templates,
indexedThesaurus,
(s, doc, sortProperty, references) => ({ doc, sortProperty, references }),
(templates, thesauris, { doc, sortProperty, references }) => {
  if (sortProperty) {
    return _formater.default.prepareMetadataForCard(doc, templates, thesauris, sortProperty).metadata;
  }
  return _formater.default.prepareMetadata(doc, templates, thesauris, references).metadata;
});


const metadataSelectors = {
  formatMetadata,
  indexedThesaurus };exports.metadataSelectors = metadataSelectors;