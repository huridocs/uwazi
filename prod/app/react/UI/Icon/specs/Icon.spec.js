"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");

var _Icon = _interopRequireWildcard(require("../Icon"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}


describe('Icon', () => {
  let component;
  let props;

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_Icon.default.WrappedComponent, props));
  };

  it('should instantiate a FontAwesomeIcon', () => {
    props = { icon: 'angle-right', size: 'xs' };
    render();
    expect(component).toMatchSnapshot();
  });

  it('should allow configuring the icon as directionAware', () => {
    props = { icon: 'angle-left', directionAware: true, locale: 'es' };
    render();
    expect(component).toMatchSnapshot();

    props = { icon: 'angle-left', directionAware: true, locale: 'ar' };
    render();
    expect(component).toMatchSnapshot();
  });

  describe('MapStateToProps', () => {
    it('should map the locale', () => {
      const state = { locale: 'en' };

      const mappedProps = (0, _Icon.mapStateToProps)(state);
      expect(mappedProps.locale).toBe(state.locale);
    });
  });
});