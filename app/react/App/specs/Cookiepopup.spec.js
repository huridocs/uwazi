/**
 * @jest-environment jsdom
 */
import React from 'react';
import { shallow } from 'enzyme';
import * as Cookie from 'tiny-cookie';
import { Notification } from '#app/Notifications/components/Notification.js';
import { CookiepopupView as Cookiepopup } from '../Cookiepopup.js';

let cookieValue;
const mockCookieGet = jest.fn().mockImplementation(() => cookieValue);
jest.mock('tiny-cookie', () => ({
  ...jest.requireActual('tiny-cookie'),
  set: jest.fn(),
  get: _name => mockCookieGet(),
}));

let component;
let props;
let instance;

describe('Cookiepopup', () => {
  beforeEach(() => {
    props = {
      cookiepolicy: true,
    };
  });

  const render = () => {
    component = shallow(<Cookiepopup {...props} />);
    instance = component.instance();
  };

  describe('when the cookiepolicy is active and the cookie not exists', () => {
    it('should render a notification', () => {
      render();
      const notification = component.find(Notification);
      expect(notification.length).toBe(1);
      expect(notification.props().id).toBe('cookiepolicy');
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
      cookieValue = 1;
      render();
      expect(component).toMatchSnapshot();
    });
  });

  describe('when closing', () => {
    it('should set the cookie', () => {
      render();
      instance.close();
      expect(Cookie.set).toHaveBeenCalledWith('cookiepolicy', 1, { expires: 3650 });
    });
  });
});
