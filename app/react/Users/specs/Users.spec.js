import React from 'react';
import {shallow} from 'enzyme';
import {Users} from '../Users';
import UsersAPI from 'app/Users/UsersAPI';
import UsersList from 'app/Users/components/UsersList';

describe('Users', () => {
  let component;
  let instance;
  let context;
  let users;

  beforeEach(() => {
    users = [{_id: 1, name: 'Batman'}];
    spyOn(UsersAPI, 'list').and.returnValue(Promise.resolve(users));
    context = {store: {dispatch: jasmine.createSpy('dispatch')}};
    component = shallow(<Users />, {context});
    instance = component.instance();
  });

  describe('requestState', () => {
    it('should get the current user, and metadata', (done) => {
      Users.requestState()
      .then((state) => {
        expect(state.users).toEqual(users);
        done();
      });
    });
  });

  describe('setReduxState', () => {
    it('should set users in state', () => {
      instance.setReduxState({users: 'users'});
      expect(context.store.dispatch).toHaveBeenCalledWith({type: 'users/SET', value: 'users'});
    });
  });

  describe('render', () => {
    it('should render a UsersList', () => {
      expect(component.find(UsersList).length).toBe(1);
    });
  });
});
