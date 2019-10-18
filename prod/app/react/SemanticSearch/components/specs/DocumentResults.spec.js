"use strict";var _react = _interopRequireDefault(require("react"));
var _immutable = _interopRequireDefault(require("immutable"));
var _enzyme = require("enzyme");
var _DocumentResults = require("../DocumentResults");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('DocumentResults', () => {
  let props;
  let component;
  beforeEach(() => {
    props = {
      doc: {
        semanticSearch: {
          results: [
          { score: 0.6, text: 'bio two', page: 'bio' },
          { score: 0.5, text: 'page one', page: '1' },
          { score: 0.2, text: 'page two', page: '2' },
          { score: 0.1, text: 'bio one', page: 'bio' }],

          relevantRate: 0.5,
          numRelevant: 2,
          totalResults: 4 },

        avgScore: 0.4 },

      threshold: 0.3,
      changeTreshHold: jasmine.createSpy('changeTreshhold'),
      selectTab: jasmine.createSpy('selectTab'),
      selectSnippet: jasmine.createSpy('selectSnippet'),
      template: _immutable.default.fromJS({
        commonProperties: [],
        properties: [
        { name: 'bio', label: 'Biography' }] }) };




    component = (0, _enzyme.shallow)(_react.default.createElement(_DocumentResults.DocumentResults, props));
  });

  describe('render', () => {
    it('should render results summary and snippets above threshold in SnippetsList', () => {
      expect(component).toMatchSnapshot();
    });
  });
});