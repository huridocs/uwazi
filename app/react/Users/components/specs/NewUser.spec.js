import React from 'react';
import { shallow } from 'enzyme';
import { NewUser } from '../NewUser';
import UserForm from '../UserForm';

describe('NewUser', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      newUser: jasmine.createSpy('newUser').and.returnValue(Promise.resolve())
    };
  });

  const render = () => {
    component = shallow(<NewUser {...props} />);
  };

  describe('render', () => {
    it('should render a form with the proper submit function', () => {
      render();
      expect(component.find(UserForm).length).toBe(1);
      expect(component.find(UserForm).props().submit).toBe(props.newUser);
    });
  });
});
