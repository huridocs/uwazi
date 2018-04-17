import React from 'react';
import { shallow } from 'enzyme';
import Immutable from 'immutable';
import { LocalForm } from 'react-redux-form';
import UserForm from '../UserForm';

describe('NewUser', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      submit: jasmine.createSpy('submit').and.returnValue(Promise.resolve()),
      user: Immutable.fromJS({ _id: 1, username: 'admin' })
    };
  });

  const render = () => {
    component = shallow(<UserForm {...props} />);
  };

  describe('render', () => {
    it('should render a form', () => {
      render();
      expect(component.find(LocalForm).length).toBe(1);
    });
  });

  describe('submit', () => {
    it('should call submit', () => {
      render();
      const instance = component.instance();
      const user = { username: 'spidey', email: 'peter@parker.com' };
      instance.submit(user);
      expect(props.submit).toHaveBeenCalledWith(user);
    });
  });
});
