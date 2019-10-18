"use strict";var _react = _interopRequireDefault(require("react"));

var _enzyme = require("enzyme");

var _immutable = _interopRequireDefault(require("immutable"));

var _Doc = _interopRequireDefault(require("../../../Library/components/Doc"));
var actions = _interopRequireWildcard(require("../../actions/actions"));

var _SemanticSearchResults = require("../SemanticSearchResults");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function ownKeys(object, enumerableOnly) {var keys = Object.keys(object);if (Object.getOwnPropertySymbols) {keys.push.apply(keys, Object.getOwnPropertySymbols(object));}if (enumerableOnly) keys = keys.filter(function (sym) {return Object.getOwnPropertyDescriptor(object, sym).enumerable;});return keys;}function _objectSpread(target) {for (var i = 1; i < arguments.length; i++) {if (i % 2) {var source = arguments[i] != null ? arguments[i] : {};ownKeys(source, true).forEach(function (key) {_defineProperty(target, key, source[key]);});} else if (Object.getOwnPropertyDescriptors) {Object.defineProperties(target, Object.getOwnPropertyDescriptors(arguments[i]));} else {ownKeys(source).forEach(function (key) {Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(arguments[i], key));});}}return target;}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}

describe('SemanticSearchResults', () => {
  let state;
  let dispatch;
  beforeEach(() => {
    state = {
      semanticSearch: {
        resultsFilters: {
          threshold: 0.3,
          minRelevantSentences: 1 },

        search: _immutable.default.fromJS({
          _id: 'id',
          searchTerm: 'query',
          query: {},
          documents: [],
          status: 'completed',
          results: [
          {
            sharedId: 'one',
            semanticSearch: {
              averageScore: 0.6,
              numRelevant: 2,
              relevantRate: 0.5,
              results: [{ score: 0.7 }, { score: 0.2 }, { score: 0.1 }] } },


          {
            sharedId: 'two',
            semanticSearch: {
              averageScore: 0.4,
              numRelevant: 1,
              relevantRate: 0.4,
              results: [{ score: 0.6 }, { score: 0.5 }, { score: 0.2 }] } }] }) } };






    dispatch = jest.fn();
  });

  const getProps = () => _objectSpread({},
  (0, _SemanticSearchResults.mapStateToProps)(state), {},
  (0, _SemanticSearchResults.mapDispatchToProps)(dispatch));


  const render = () => (0, _enzyme.shallow)(_react.default.createElement(_SemanticSearchResults.SemanticSearchResults, getProps()));

  it('should render results in ItemList', () => {
    const component = render();
    expect(component).toMatchSnapshot();
  });

  describe('when the search is empty', () => {
    it('should render not found page', () => {
      state.semanticSearch.search = _immutable.default.fromJS({});
      const component = render();
      expect(component).toMatchSnapshot();
    });
  });
  it('should select document when item is clicked', () => {
    jest.spyOn(actions, 'selectSemanticSearchDocument').mockImplementation(() => {});
    const component = render();
    component.find(_Doc.default).first().simulate('click');
    expect(actions.selectSemanticSearchDocument).toHaveBeenCalled();
  });

  describe('when load more button is clicked', () => {
    it('should fetch the next 30 results using the same filters', () => {
      jest.spyOn(actions, 'getMoreSearchResults').mockImplementation(() => {});
      const component = render();
      component.find('.btn-load-more').first().simulate('click');
      expect(actions.getMoreSearchResults).toHaveBeenCalledWith('id', { limit: 30, minRelevantSentences: 1, threshold: 0.3, skip: 30 });
      component.update();
      component.find('.btn-load-more').first().simulate('click');
      expect(actions.getMoreSearchResults).toHaveBeenCalledWith('id', { limit: 30, minRelevantSentences: 1, threshold: 0.3, skip: 60 });
    });
  });

  describe('when edit button is clicked', () => {
    it('should edit all documents that match the search filters', () => {
      jest.spyOn(actions, 'editSearchEntities').mockImplementation(() => {});
      const component = render();
      component.find('.edit-semantic-search').first().simulate('click');
      expect(actions.editSearchEntities).toHaveBeenCalledWith('id', { minRelevantSentences: 1, threshold: 0.3 });
    });
  });
});