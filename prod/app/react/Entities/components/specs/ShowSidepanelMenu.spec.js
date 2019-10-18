"use strict";var _react = _interopRequireDefault(require("react"));

var _enzyme = require("enzyme");

var _ShowSidepanelMenu = require("../ShowSidepanelMenu");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('ShowSidepanelMenu', () => {
  let component;
  let props;
  beforeEach(() => {
    props = {
      active: false,
      panelIsOpen: true,
      openPanel: jest.fn() };

  });

  function render() {
    component = (0, _enzyme.shallow)(_react.default.createElement(_ShowSidepanelMenu.ShowSidepanelMenu, props));
  }

  beforeEach(() => {
    render();
  });

  it('should show button if panel is not open', () => {
    props.panelIsOpen = false;
    render();
    expect(component).toMatchSnapshot();
  });

  it('should call openPanel when button is clicked', () => {
    props.panelIsOpen = false;
    render();
    component.find('.btn').simulate('click');
    expect(props.openPanel).toHaveBeenCalled();
  });
});