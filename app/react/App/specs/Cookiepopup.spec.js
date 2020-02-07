/**
 * @jest-environment jsdom
 */
import React from 'react';
import { shallow } from 'enzyme';
import * as Cookie from 'tiny-cookie';
import { Cookiepopup } from '../Cookiepopup';

describe('Cookiepopup', () => {
  let component;
  let props;
  let getCookie;
  let setCookie;
  let instance;

  beforeEach(() => {
    props = {
      cookiepolicy: true,
    };
    getCookie = spyOn(Cookie, 'get');
    setCookie = spyOn(Cookie, 'set');
  });

  const render = () => {
    component = shallow(<Cookiepopup {...props} />);
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
