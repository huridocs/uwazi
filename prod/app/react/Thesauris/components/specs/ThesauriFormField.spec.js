"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var _ThesauriFormField = require("../ThesauriFormField");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('ThesauriFormField', () => {
  let component;
  let props;
  beforeEach(() => {
    props = {
      value: {
        label: 'Item1',
        id: 'item1' },

      index: 1,
      removeValue: jest.fn() };

  });

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_ThesauriFormField.ThesauriFormField, props));
  };

  it('should render thesaurus item field', () => {
    render();
    expect(component).toMatchSnapshot();
  });

  describe('delete button', () => {
    it('should remove item when clicked', () => {
      render();
      component.find('button').first().simulate('click');
      expect(props.removeValue).toHaveBeenCalledWith(props.index, undefined);
    });
    it('should pass groupIndex to removeValue if provided', () => {
      props.groupIndex = 5;
      render();
      component.find('button').first().simulate('click');
      expect(props.removeValue).toHaveBeenCalledWith(props.index, 5);
    });
  });
});