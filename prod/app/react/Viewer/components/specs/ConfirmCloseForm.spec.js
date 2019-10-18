"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var _immutable = _interopRequireDefault(require("immutable"));

var _Modal = _interopRequireDefault(require("../../../Layout/Modal"));

var _ConfirmCloseForm = require("../ConfirmCloseForm");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('ConfirmCloseForm', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      hideModal: jasmine.createSpy('hideModal'),
      resetForm: jasmine.createSpy('resetForm'),
      closePanel: jasmine.createSpy('closePanel'),
      doc: _immutable.default.fromJS({ _id: 'docId', title: 'test' }) };

  });

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_ConfirmCloseForm.ConfirmCloseForm, props));
  };

  it('should open modal if doc is not undefined', () => {
    render();
    expect(component.find(_Modal.default).props().isOpen).toBe(true);
  });

  describe('when clicking Ok', () => {
    it('should close modal and reset form', () => {
      render();
      component.find('.confirm-button').simulate('click');
      expect(props.hideModal).toHaveBeenCalledWith('ConfirmCloseForm');
      expect(props.resetForm).toHaveBeenCalledWith('documentViewer.sidepanel.metadata');
      expect(props.closePanel).toHaveBeenCalled();
    });
  });

  describe('when clicking cancel button', () => {
    it('should call hideModal', () => {
      render();
      component.find('.cancel-button').simulate('click');
      expect(props.hideModal).toHaveBeenCalledWith('ConfirmCloseForm');
    });
  });
});