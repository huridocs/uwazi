"use strict";var _react = _interopRequireDefault(require("react"));

var _enzyme = require("enzyme");

var _ConfirmModal = _interopRequireDefault(require("../ConfirmModal"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('ConfirmModal', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      onAccept: jasmine.createSpy('onAccept'),
      onCancel: jasmine.createSpy('onCancel') };

  });

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_ConfirmModal.default, props));
  };

  it('should render a confirm modal', () => {
    render();
    expect(component).toMatchSnapshot();
  });

  describe('when clicking on cancel/accept buttond', () => {
    it('should call onCancel and onAccept', () => {
      render();
      component.find('.cancel-button').simulate('click');
      expect(props.onCancel).toHaveBeenCalled();

      component.find('.confirm-button').simulate('click');
      expect(props.onAccept).toHaveBeenCalled();
    });
  });
});