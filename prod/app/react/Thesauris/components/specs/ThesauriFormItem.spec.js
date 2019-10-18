"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var _ThesauriFormItem = require("../ThesauriFormItem");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('ThesauriFormItem', () => {
  let component;
  let props;
  beforeEach(() => {
    props = {
      value: {
        label: 'Item1',
        id: 'item1' },

      index: 1,
      removeValue: jest.fn(),
      onChange: jest.fn() };

  });

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_ThesauriFormItem.ThesauriFormItem, props));
  };

  it('should render ThesauriFormField if single item is provided', () => {
    render();
    expect(component).toMatchSnapshot();
  });

  it('should render ThesauriFromGroup if item with values is provided', () => {
    props.value.values = [{ label: 'nested 1' }, { label: 'nested 2' }];
    render();
    expect(component).toMatchSnapshot();
  });
});