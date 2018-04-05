import React from 'react';
import { shallow } from 'enzyme';
import Immutable from 'immutable';
import { EditUser, mapStateToProps } from '../EditUser';
import UserForm from '../UserForm';

describe('EditUser', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      user: Immutable.fromJS({}),
      saveUser: jasmine.createSpy('saveUser').and.returnValue(Promise.resolve())
    };
  });

  const render = () => {
    component = shallow(<EditUser {...props} />);
  };

  describe('render', () => {
    it('should render a UserForm and pass saveUser and the user', () => {
      render();
      expect(component.find(UserForm).length).toBe(1);
      expect(component.find(UserForm).props().submit).toBe(props.saveUser);
      expect(component.find(UserForm).props().user).toBe(props.user);
    });
  });

  describe('mapStateToProps', () => {
    it('should find the correct user', () => {
      const _props = { params: { userId: 1 } };
      const state = {
        users: [Immutable.fromJS({ _id: 1, name: 'Batman' }), Immutable.fromJS({ _id: 2, name: 'Joker' })]
      };
      const mappedProps = mapStateToProps(state, _props);
      expect(mappedProps.user.get('name')).toBe('Batman');
    });
  });
});
