"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");

var _ToggleStyleButtons = require("../ToggleStyleButtons");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('ToggleStyleButtons', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      view: 'another',
      switchView: jasmine.createSpy('switchView') };

  });

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_ToggleStyleButtons.ToggleStyleButtons, props));
  };

  it('should hold two buttons that switch view to list and graph', () => {
    render();
    expect(props.switchView).not.toHaveBeenCalled();

    component.find('button').at(0).simulate('click');
    expect(props.switchView).toHaveBeenCalledWith('list');
    props.switchView.calls.reset();

    component.find('button').at(1).simulate('click');
    expect(props.switchView).toHaveBeenCalledWith('graph');
  });

  describe('mapStateToProps', () => {
    it('should pass current view', () => {
      const state = { connectionsList: { view: 'currentView' } };
      expect((0, _ToggleStyleButtons.mapStateToProps)(state).view).toBe('currentView');
    });
  });
});