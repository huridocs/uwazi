"use strict";var _reactTabsRedux = require("react-tabs-redux");
var _react = _interopRequireDefault(require("react"));

var _enzyme = require("enzyme");
var _Markdown = _interopRequireDefault(require("../../../Markdown"));

var _MarkDown = _interopRequireDefault(require("../MarkDown"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('MarkDown', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      value: '<b>This is a title</b>',
      onChange: jasmine.createSpy('onChange') };

  });

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_MarkDown.default, props));
  };

  it('should have an edit tab with a textarea', () => {
    render();

    const tablinks = component.find(_reactTabsRedux.TabLink);
    expect(tablinks.first().props().to).toBe('edit');

    const tabs = component.find(_reactTabsRedux.TabContent);
    expect(tabs.first().props().for).toBe('edit');

    const textarea = tabs.first().find('textarea');
    expect(textarea.length).toBe(1);
  });

  it('should put the value in the textarea and default to 6 rows', () => {
    render();
    const textarea = component.find(_reactTabsRedux.TabContent).first().find('textarea');
    expect(textarea.props().value).toBe('<b>This is a title</b>');
    expect(textarea.props().rows).toBe(6);
  });

  it('should allow to customize de number of rows', () => {
    props.rows = 12;
    render();
    const textarea = component.find(_reactTabsRedux.TabContent).first().find('textarea');
    expect(textarea.props().rows).toBe(12);
  });

  describe('preview tab', () => {
    it('shows markdown as html', () => {
      props.value = '# <b>This is a title</b>';
      render();
      const container = component.find(_Markdown.default);
      expect(container.props().markdown).toBe('# <b>This is a title</b>');
    });
  });
});