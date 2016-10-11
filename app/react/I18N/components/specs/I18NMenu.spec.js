import React from 'react';
import {shallow} from 'enzyme';
import {Link} from 'react-router';

import {I18NMenu} from '../I18NMenu';
import Immutable from 'immutable';
import Cookie from 'tiny-cookie';

describe('I18NMenu', () => {
  let component;
  let props;
  let instance;

  beforeEach(() => {
    spyOn(Cookie, 'set');
    let languages = [
      {key: 'en', label: 'English', default: true},
      {key: 'es', label: 'Español'}
    ];
    props = {
      languages: Immutable.fromJS(languages),
      location: {
        pathname: '/templates/2452345',
        search: '?query=weneedmoreclerics'
      }
    };
  });

  let render = () => {
    component = shallow(<I18NMenu {...props} />);
    instance = component.instance();
    spyOn(instance, 'reload');
  };

  describe('when there is NO language in the url', () => {
    it('should render links for each language', () => {
      render();
      let links = component.find('a');
      expect(links.length).toBe(2);
      expect(links.first().props().href).toBe('/en/templates/2452345?query=weneedmoreclerics');
      expect(links.last().props().href).toBe('/es/templates/2452345?query=weneedmoreclerics');
    });

    it('should work fine with triky urls', () => {
      props.location.pathname = '/entity/2452345';
      render();
      let links = component.find('a');
      expect(links.length).toBe(2);
      expect(links.first().props().href).toBe('/en/entity/2452345?query=weneedmoreclerics');
      expect(links.last().props().href).toBe('/es/entity/2452345?query=weneedmoreclerics');
    });

    it('should render as active the default language', () => {
      render();
      expect(component.find('li').first().props().className).toBe('Dropdown-option is-active');
    });
  });

  describe('when there IS language in the url', () => {
    it('should render links for each language', () => {
      props.location.pathname = '/es/templates/2452345';
      render();
      let links = component.find('a');
      expect(links.length).toBe(2);
      expect(links.first().props().href).toBe('/en/templates/2452345?query=weneedmoreclerics');
      expect(links.last().props().href).toBe('/es/templates/2452345?query=weneedmoreclerics');
      expect(component.find('li').last().props().className).toBe('Dropdown-option is-active');
    });

    it('should render as active the selected language', () => {
      props.location.pathname = '/es/templates/2452345';
      render();
      expect(component.find('li').last().props().className).toBe('Dropdown-option is-active');
    });

    it('should render links for each language', () => {
      props.location.pathname = '/es';
      props.location.search = '';
      render();
      let links = component.find('a');
      expect(links.length).toBe(2);
      expect(links.first().props().href).toBe('/en/');
      expect(links.last().props().href).toBe('/es/');
    });
  });

  describe('when switching language', () => {
    it('should save the locale in to a coockie', () => {
      render();
      let links = component.find('a');
      links.first().simulate('click');
      expect(Cookie.set).toHaveBeenCalledWith('locale', 'en', {expires: 3650});
    });
  });
});
