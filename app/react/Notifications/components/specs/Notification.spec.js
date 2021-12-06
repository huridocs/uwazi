import React from 'react';
import { shallow } from 'enzyme';
import { Icon } from 'UI';

import { Notification } from 'app/Notifications/components/Notification';

describe('Notification', () => {
  let component;
  let props;
  const removeNotification = jasmine.createSpy('removeNotification');

  const render = (type, message = 'message') => {
    props = { message, id: 'id', removeNotification };
    if (type) {
      props.type = type;
    }
    component = shallow(<Notification {...props} />);
  };

  it('should render message passed', () => {
    render();
    expect(component.text()).toContain('message');
  });

  describe('when not passing type', () => {
    it('should have a info icon and info alert', () => {
      render();
      expect(component.find(Icon).at(0).props().icon).toBe('check');
      expect(component.find('.alert-success').length).toBe(1);
    });
  });

  describe('when passing warning type', () => {
    it('should have a exclamation icon and warning alert', () => {
      render('warning');
      expect(component.find(Icon).at(0).props().icon).toBe('exclamation-triangle');
      expect(component.find('.alert-warning').length).toBe(1);
    });
  });

  describe('when passing danger type', () => {
    it('should have a exclamation icon and danger alert', () => {
      render('danger');
      expect(component.find(Icon).at(0).props().icon).toBe('exclamation-triangle');
      expect(component.find('.alert-danger').length).toBe(1);
    });
  });

  describe('when passing an escaped line message', () => {
    it('should split the text', () => {
      render('warning', 'Three\nLine\nText');
      expect(component.find('br').length).toBe(3);
    });
  });

  describe('when passing a node', () => {
    it('should render that node', () => {
      const message = <div className="passed-node">Some node</div>;
      render('warning', message);

      expect(component.find('div.passed-node').length).toBe(1);
    });
  });
});
