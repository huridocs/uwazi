import React from 'react';
import {shallow} from 'enzyme';

import {Notification} from 'app/Notifications/components/Notification';

describe('Notification', () => {
  let component;
  let props;
  let removeNotification = jasmine.createSpy('removeNotification');

  let render = (type) => {
    props = {message: 'message', id: 'id', removeNotification};
    if (type) {
      props.type = type;
    }
    component = shallow(<Notification {...props}/>);
  };

  it('should render message passed', () => {
    render();
    expect(component.text()).toBe('message');
  });

  describe('when not passing type', () => {
    it('should have a info icon and info alert', () => {
      render();
      expect(component.find('.fa-info-circle').length).toBe(1);
      expect(component.find('.alert-info').length).toBe(1);
    });
  });

  describe('when clicking on remove', () => {
    it('removeNotification', () => {
      component.find('.alert-close').simulate('click');
      expect(removeNotification).toHaveBeenCalledWith('id');
    });
  });

  describe('when passing warning type', () => {
    it('should have a exclamation icon and warning alert', () => {
      render('warning');
      expect(component.find('.fa-exclamation-triangle').length).toBe(1);
      expect(component.find('.alert-warning').length).toBe(1);
    });
  });

  describe('when passing danger type', () => {
    it('should have a exclamation icon and danger alert', () => {
      render('danger');
      expect(component.find('.fa-exclamation-triangle').length).toBe(1);
      expect(component.find('.alert-danger').length).toBe(1);
    });
  });
});
