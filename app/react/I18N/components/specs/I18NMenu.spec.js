import React from 'react';
import { shallow } from 'enzyme';
import Immutable from 'immutable';

import I18NMenu from '../I18NMenu';

describe('I18NMenu', () => {
  let component;
  let props;

  beforeEach(() => {
    const languages = [
      { key: 'en', label: 'English', default: true },
      { key: 'es', label: 'Español' },
    ];

    props = {
      languages: Immutable.fromJS(languages),
      toggleInlineEdit: jasmine.createSpy('toggleInlineEdit'),
      i18nmode: false,
      location: {
        pathname: '/templates/2452345',
        search: '?query=weneedmoreclerics',
      },
      locale: 'es',
    };
  });

  const render = () => {
    component = shallow(<I18NMenu.WrappedComponent {...props} />);
    spyOn(I18NMenu, 'reload');
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

  describe('Page query', () => {
    it('Should not add the document page to the URL when viewing entities', () => {
      props.locale = 'en';
      props.location.pathname = '/en/entity/r2dzptt7ts';
      props.location.search = '?page=2';
      render();
      const links = component.find('a');
      expect(links.length).toBe(2);
      expect(links.first().props().href).toBe('/en/entity/r2dzptt7ts');
      expect(links.last().props().href).toBe('/es/entity/r2dzptt7ts');
    });

    it('should remove the page query from the url without affecting other parameters', () => {
      props.location.pathname = '/es/entity/r2dzptt7ts';
      props.location.search = '?searchTerm=title&page=2';
      render();
      const links = component.find('a');
      expect(links.length).toBe(2);
      expect(links.last().props().href).toBe('/es/entity/r2dzptt7ts?searchTerm=title');
      expect(links.first().props().href).toBe('/en/entity/r2dzptt7ts?searchTerm=title');
    });
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
      props.languages = Immutable.fromJS([{ key: 'en', label: 'English', default: true }]);
      render();
      expect(component).toMatchSnapshot();
    });
  });
});
