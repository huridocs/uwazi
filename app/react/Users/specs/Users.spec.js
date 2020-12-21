import React from 'react';
import { shallow } from 'enzyme';
import UsersAPI from 'app/Users/UsersAPI';
import { UserManagement } from 'app/Users/UserManagement';
import { Users } from '../Users';

describe('Users', () => {
  let component;
  let context;
  let users;

  beforeEach(() => {
    users = [{ _id: 1, name: 'Batman' }];
    spyOn(UsersAPI, 'get').and.returnValue(Promise.resolve(users));
    context = { store: { getState: () => ({}), dispatch: jasmine.createSpy('dispatch') } };
    component = shallow(<Users />, { context });
  });

  describe('requestState', () => {
    it('should get the current user, and metadata', async () => {
      const request = {};
      const actions = await Users.requestState(request);

      expect(actions).toMatchSnapshot();
      expect(UsersAPI.get).toHaveBeenCalledWith(request);
    });
  });

  describe('render', () => {
    it('should render a UsersList', () => {
      expect(component.find(UserManagement).length).toBe(1);
    });
  });
});
