"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var _reactFlags = _interopRequireDefault(require("react-flags"));
var _immutable = _interopRequireDefault(require("immutable"));
var _UI = require("../../UI");
var _Icon = require("../Icon");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('Icon', () => {
  let component;
  let props;

  describe('Fontawesome', () => {
    beforeEach(() => {
      props = {
        data: { _id: 'iconid', type: 'Icons', label: 'iconlabel' },
        className: 'passed-classname',
        size: 'md' };

    });

    const render = () => {
      component = (0, _enzyme.shallow)(_react.default.createElement(_Icon.Icon, props));
    };

    it('should render a fontawesome icon', () => {
      render();
      expect(component.find('span').props().className).toBe('passed-classname');
      expect(component.find(_UI.Icon).props().icon).toBe('iconid');
    });

    it('should render different size icons', () => {
      render();
      expect(component.find(_UI.Icon).props().size).toBe('2x');

      props.size = 'sm';
      render();
      expect(component.find(_UI.Icon).props().size).toBe('lg');
    });
  });

  describe('Flags', () => {
    beforeEach(() => {
      props = {
        data: { _id: 'flagid', type: 'Flags', label: 'flaglabel' },
        className: 'passed-flag-classname',
        size: 'md' };

    });

    const render = () => {
      component = (0, _enzyme.shallow)(_react.default.createElement(_Icon.Icon, props));
    };

    it('should render a Flag icon', () => {
      render();
      expect(component.find('span').props().className).toBe('passed-flag-classname');
      expect(component.find(_reactFlags.default).props().name).toBe('flagid');
      expect(component.find(_reactFlags.default).props().basePath).toBe('/flag-images');
    });

    it('should render different size icons', () => {
      render();
      expect(component.find(_reactFlags.default).props().pngSize).toBe(32);

      props.size = 'sm';
      render();
      expect(component.find(_reactFlags.default).props().pngSize).toBe(24);
    });

    describe('when data is immutable', () => {
      it('should render a Flag icon', () => {
        props.data = _immutable.default.fromJS({ _id: 'flagid', type: 'Flags', label: 'flaglabel' });
        render();
        expect(component.find('span').props().className).toBe('passed-flag-classname');
        expect(component.find(_reactFlags.default).props().name).toBe('flagid');
        expect(component.find(_reactFlags.default).props().basePath).toBe('/flag-images');
      });
    });
  });
});