"use strict";var _react = _interopRequireDefault(require("react"));

var _enzyme = require("enzyme");

var _ConfirmButton = _interopRequireDefault(require("../ConfirmButton"));

var _ConfirmModal = _interopRequireDefault(require("../ConfirmModal"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('ConfirmButton', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      action: jasmine.createSpy('action') };

  });

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_ConfirmButton.default, props, "text"));
  };

  it('should render a button', () => {
    render();
    expect(component).toMatchSnapshot();
  });

  describe('on click', () => {
    it('should render a Confirm modal', () => {
      render();
      component.find('button').simulate('click');
      component.update();
      expect(component).toMatchSnapshot();
    });

    describe('onAccept', () => {
      it('should execute action and close modal', () => {
        render();
        component.find('button').simulate('click');
        component.update();
        component.find(_ConfirmModal.default).props().onAccept();
        component.update();

        expect(component).toMatchSnapshot();
        expect(props.action).toHaveBeenCalled();
      });
    });

    describe('onCancel', () => {
      it('should should close modal', () => {
        render();
        component.find('button').simulate('click');
        component.update();
        component.find(_ConfirmModal.default).props().onCancel();
        component.update();

        expect(component).toMatchSnapshot();
      });
    });
  });
});