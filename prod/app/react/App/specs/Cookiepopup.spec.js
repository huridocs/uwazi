"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var Cookie = _interopRequireWildcard(require("tiny-cookie"));
var _Cookiepopup = require("../Cookiepopup");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('Cookiepopup', () => {
  let component;
  let props;
  let getCookie;
  let setCookie;
  let instance;

  beforeEach(() => {
    props = {
      cookiepolicy: true };

    getCookie = spyOn(Cookie, 'get');
    setCookie = spyOn(Cookie, 'set');
  });

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_Cookiepopup.Cookiepopup, props));
    instance = component.instance();
  };

  describe('when the cookiepolicy is active and the cookie not exists', () => {
    it('should render a notification', () => {
      render();
      expect(component).toMatchSnapshot();
    });
  });

  describe('when the cookiepolicy is disabled', () => {
    it('should not render a notification', () => {
      props.cookiepolicy = false;
      render();
      expect(component).toMatchSnapshot();
    });
  });

  describe('when the cookie already exists', () => {
    it('should not render a notification', () => {
      getCookie.and.returnValue(1);
      render();
      expect(component).toMatchSnapshot();
    });
  });

  describe('when closing', () => {
    it('should set the cookie', () => {
      render();
      instance.close();
      expect(setCookie).toHaveBeenCalledWith('cookiepolicy', 1, { expires: 3650 });
    });
  });
});