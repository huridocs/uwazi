import React from 'react';
import {shallow} from 'enzyme';
import {fromJS, Map} from 'immutable';

import {UsersList} from '../UsersList';
import {I18NLink} from 'app/I18N';

describe('UsersList', () => {
  let component;
  let props;
  let context;

  beforeEach(() => {
    props = {
      users: fromJS([
        {_id: 1, username: 'User 1', sharedId: 'a1'},
        {_id: 2, username: 'User 2', sharedId: 'a2'},
        {_id: 3, username: 'User 3', sharedId: 'a3'}
      ]),
      deleteUser: jasmine.createSpy('deleteUser').and.returnValue(Promise.resolve())
    };

    context = {
      confirm: jasmine.createSpy('confirm')
    };
  });

  let render = () => {
    component = shallow(<UsersList {...props} />, {context});
  };

  describe('render', () => {
    it('should render a list with all users names', () => {
      render();
      expect(component.find('ul.users').find('li').length).toBe(3);
      let nameLink = component.find('ul.users').find('li').last().find(I18NLink).first();
      expect(nameLink.props().to).toBe('/settings/users/edit/a3');
      expect(nameLink.props().children).toBe('User 3');
    });

    it('should have a button to add a page', () => {
      render();
      expect(component.find(I18NLink).last().props().to).toBe('/settings/users/new');
    });
  });

  describe('deleteUser', () => {
    beforeEach(() => {
      render();
      component.instance().deleteUser(Map({_id: 3, title: 'Judge', sharedId: 'a3'}));
    });

    it('should confirm the action', () => {
      expect(context.confirm).toHaveBeenCalled();
    });

    it('should call on props.deleteUser if confirmed', () => {
      context.confirm.calls.argsFor(0)[0].accept();
      expect(props.deleteUser).toHaveBeenCalledWith({_id: 3, sharedId: 'a3'});
    });
  });
});
