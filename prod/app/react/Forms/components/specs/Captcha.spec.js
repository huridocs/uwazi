"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");

var _Captcha = _interopRequireDefault(require("../Captcha"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('Captcha', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      onChange: () => {} };

  });

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_Captcha.default, props));
  };

  it('should render a Captcha image with an input', () => {
    render();
    expect(component).toMatchSnapshot();
  });

  describe('refresh()', () => {
    it('should return the refresh captcha method', done => {
      let refreshCaptcha;
      props.refresh = _refreshCaptcha => {
        refreshCaptcha = _refreshCaptcha;
      };
      render();
      expect(component.find('img').props().src).toBe('/captcha');
      refreshCaptcha();
      component.update();
      expect(component.find('img').props().src).not.toBe('/captcha');
      done();
    });
  });
});