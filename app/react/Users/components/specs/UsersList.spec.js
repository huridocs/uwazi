/** @format */

import React from 'react';
import { shallow } from 'enzyme';
import { fromJS, Map } from 'immutable';

import { UsersList } from '../UsersList';

describe('UsersList', () => {
  let component;
  let props;
  let context;

  beforeEach(() => {
    props = {
      users: fromJS([
        { _id: 1, username: 'User 1', sharedId: 'a1' },
        { _id: 2, username: 'User 2', sharedId: 'a2', using2fa: true },
        { _id: 3, username: 'User 3', sharedId: 'a3' },
      ]),
      deleteUser: jasmine.createSpy('deleteUser').and.returnValue(Promise.resolve()),
      reset2fa: jasmine.createSpy('reset2fa').and.returnValue(Promise.resolve()),
    };

    context = {
      confirm: jasmine.createSpy('confirm'),
    };
  });

  const render = () => {
    component = shallow(<UsersList {...props} />, { context });
  };

  describe('render', () => {
    it('should render a list with all users names, edit and delete buttons and global add button', () => {
      render();
      expect(component).toMatchSnapshot();
    });
  });

  describe('deleteUser', () => {
    beforeEach(() => {
      render();
      component.instance().deleteUser(Map({ _id: 3, title: 'Judge', sharedId: 'a3' }));
    });

    it('should confirm the action', () => {
      expect(context.confirm).toHaveBeenCalled();
    });

    it('should call on props.deleteUser if confirmed', () => {
      context.confirm.calls.argsFor(0)[0].accept();
      expect(props.deleteUser).toHaveBeenCalledWith({ _id: 3, sharedId: 'a3' });
    });
  });

  describe('reset2fa', () => {
    let user;
    beforeEach(() => {
      user = { _id: 3, title: 'Judge', sharedId: 'a3' };
      render();
      component.instance().reset2fa(Map(user));
    });

    it('should confirm calling on reset2fa if confirmed', () => {
      expect(context.confirm).toHaveBeenCalled();
      context.confirm.calls.argsFor(0)[0].accept();
      expect(props.reset2fa).toHaveBeenCalledWith(user);
    });
  });
});
