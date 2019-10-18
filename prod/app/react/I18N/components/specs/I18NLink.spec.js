"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var _reactRouter = require("react-router");

var _I18NLink = require("../I18NLink");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('I18NLink', () => {
  let component;
  let props;
  const clickAction = () => {};
  const mouseOverAction = () => {};
  const event = jasmine.createSpyObj(['preventDefault']);

  beforeEach(() => {
    props = {
      locale: 'es',
      to: '/templates',
      activeClass: 'is-active',
      onClick: clickAction,
      onMouseOver: mouseOverAction,
      dispatch: () => {} };

  });

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_I18NLink.I18NLink, props));
  };

  describe('render', () => {
    it('should pass other props, except for dispatch', () => {
      spyOn(props, 'onClick');
      render();
      const link = component.find(_reactRouter.Link);
      expect(link.props().onMouseOver).toBe(mouseOverAction);
      expect(link.props().dispatch).toBeUndefined();
      component.simulate('click', event);
      expect(props.onClick).toHaveBeenCalledWith(event);
    });
  });

  describe('when its disabled', () => {
    it('should do nothing when clicked', () => {
      spyOn(props, 'onClick');
      props.disabled = true;
      render();
      component.simulate('click', event);
      expect(props.onClick).not.toHaveBeenCalled();
      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  describe('mapStateToProps', () => {
    it('should append the locale to the "to" url', () => {
      expect((0, _I18NLink.mapStateToProps)({ locale: 'es' }, props).to).toBe('/es/templates');
    });

    describe('when there is no locale', () => {
      it('should pass the "to" url unchanged', () => {
        expect((0, _I18NLink.mapStateToProps)({}, props).to).toBe('/templates');
      });
    });
  });
});