"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var _immutable = _interopRequireDefault(require("immutable"));

var _I18NMenu = _interopRequireDefault(require("../I18NMenu"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('I18NMenu', () => {
  let component;
  let props;

  beforeEach(() => {
    const languages = [
    { key: 'en', label: 'English', default: true },
    { key: 'es', label: 'Español' }];


    props = {
      languages: _immutable.default.fromJS(languages),
      toggleInlineEdit: jasmine.createSpy('toggleInlineEdit'),
      i18nmode: false,
      location: {
        pathname: '/templates/2452345',
        search: '?query=weneedmoreclerics' },

      locale: 'es' };

  });

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_I18NMenu.default.WrappedComponent, props));
    spyOn(_I18NMenu.default, 'reload');
  };

  it('should not render searchQuery when on documents path', () => {
    props.location.pathname = '/es/documents';
    props.location.search = '?search';
    render();
    const links = component.find('a');
    expect(links.length).toBe(2);
    expect(links.first().props().href).toBe('/en/documents');
    expect(links.last().props().href).toBe('/es/documents');
  });

  describe('when there is NO locale', () => {
    beforeEach(() => {
      props.locale = null;
    });

    it('should render links for each language', () => {
      render();
      const links = component.find('a');
      expect(links.length).toBe(2);
      expect(links.first().props().href).toBe('/en/templates/2452345?query=weneedmoreclerics');
      expect(links.last().props().href).toBe('/es/templates/2452345?query=weneedmoreclerics');
    });

    it('should work fine with triky urls', () => {
      props.location.pathname = '/entity/2452345';
      render();
      const links = component.find('a');
      expect(links.length).toBe(2);
      expect(links.first().props().href).toBe('/en/entity/2452345?query=weneedmoreclerics');
      expect(links.last().props().href).toBe('/es/entity/2452345?query=weneedmoreclerics');
    });
  });

  describe('when there IS language in the url', () => {
    it('should render links for each language', () => {
      props.location.pathname = '/es/templates/2452345';
      render();
      const links = component.find('a');
      expect(links.length).toBe(2);
      expect(links.first().props().href).toBe('/en/templates/2452345?query=weneedmoreclerics');
      expect(links.last().props().href).toBe('/es/templates/2452345?query=weneedmoreclerics');
      expect(component.find('li').last().props().className).toBe('menuNav-item is-active');
    });

    it('should render as active the passed language when params.lang is not defined', () => {
      props.params = {};
      props.language = 'es';
      render();
      expect(component.find('li').last().props().className).toBe('menuNav-item is-active');
    });

    it('should render as active the selected language', () => {
      props.location.pathname = '/es/templates/2452345';
      render();
      expect(component.find('li').last().props().className).toBe('menuNav-item is-active');
    });

    it('should render links for each language', () => {
      props.location.pathname = '/es';
      props.location.search = '';
      render();
      const links = component.find('a');
      expect(links.length).toBe(2);
      expect(links.first().props().href).toBe('/en/');
      expect(links.last().props().href).toBe('/es/');
    });
  });

  describe('when there is only one language', () => {
    it('should only render the inline translation button', () => {
      props.languages = _immutable.default.fromJS([{ key: 'en', label: 'English', default: true }]);
      render();
      expect(component).toMatchSnapshot();
    });
  });
});