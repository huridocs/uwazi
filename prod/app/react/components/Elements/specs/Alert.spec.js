"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");

var _Alert = _interopRequireDefault(require("../Alert.js"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('Alert', () => {
  let component;
  let instance;
  let props;

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_Alert.default, props));
    instance = component.instance();
  };

  it('should display the message', () => {
    props = { message: 'Finaly, you are up!', type: 'success' };
    render();
    expect(component).toMatchSnapshot();


    props = { message: 'Warning!', type: 'warning' };
    render();
    expect(component).toMatchSnapshot();


    props = { message: 'Danger!', type: 'danger' };
    render();
    expect(component).toMatchSnapshot();
  });

  describe('show', () => {
    it('should not render if component hasnt a message', () => {
      props = { message: '' };
      render();
      expect(component).toMatchSnapshot();
    });
  });

  describe('hide()', () => {
    it('should hide the Alert', () => {
      props = { message: 'Finaly, you are up!', type: 'success' };
      render();

      instance.hide();
      component.update();
      expect(component).toMatchSnapshot();
    });
  });

  describe('show()', () => {
    it('should show the Alert', () => {
      props = { message: '' };
      render();

      instance.show();
      component.update();
      expect(component).toMatchSnapshot();
    });
  });
});