"use strict";var _immutable = require("immutable");
var _react = _interopRequireDefault(require("react"));

var _enzyme = require("enzyme");
var _Markdown = _interopRequireDefault(require("../../../Markdown"));

var _PageViewer = require("../PageViewer");
var _Script = _interopRequireDefault(require("../Script"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('PageViewer', () => {
  let component;
  let props;
  let context;

  beforeEach(() => {
    props = {
      page: (0, _immutable.fromJS)({ _id: 1, title: 'Page 1', metadata: { content: 'MarkdownContent', script: 'JSScript' } }),
      itemLists: (0, _immutable.fromJS)([{ item: 'item' }]) };

  });

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_PageViewer.PageViewer, props), { context });
  };

  describe('render', () => {
    beforeEach(() => {
      render();
    });

    it('should render a MarkdownViewer with the markdown and the items for the lists', () => {
      expect(component.find(_Markdown.default).props().markdown).toBe('MarkdownContent');
      expect(component.find(_Markdown.default).props().lists).toEqual([{ item: 'item' }]);
    });

    it('should render the script', () => {
      const scriptElement = component.find(_Script.default);
      expect(scriptElement).toMatchSnapshot();
    });
  });
});