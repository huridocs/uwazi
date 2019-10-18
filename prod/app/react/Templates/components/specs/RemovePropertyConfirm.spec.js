"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");

var _RemovePropertyConfirm = require("../RemovePropertyConfirm");
var _Modal = _interopRequireDefault(require("../../../Layout/Modal.js"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('RemovePropertyConfirm', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      hideModal: jasmine.createSpy('hideModal'),
      removeProperty: jasmine.createSpy('removeProperty'),
      propertyBeingDeleted: 1 };

  });

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_RemovePropertyConfirm.RemovePropertyConfirm, props));
  };

  it('should render a default closed modal', () => {
    render();
    expect(component.find(_Modal.default).props().isOpen).toBe(false);
  });

  it('should pass isOpen', () => {
    props.isOpen = true;
    render();
    expect(component.find(_Modal.default).props().isOpen).toBe(true);
  });

  describe('when clicking confirm button', () => {
    it('should call removeProperty and hideRemovePropertyConfirm', () => {
      render();
      component.find('.confirm-button').simulate('click');
      expect(props.removeProperty).toHaveBeenCalledWith(1);
      expect(props.hideModal).toHaveBeenCalledWith('RemovePropertyModal');
    });
  });

  describe('when clicking cancel button or close button', () => {
    it('should call hideRemovePropertyConfirm', () => {
      render();
      component.find('.cancel-button').simulate('click');
      expect(props.hideModal).toHaveBeenCalledWith('RemovePropertyModal');
    });
  });
});