/**
 * @jest-environment jsdom
 */
import React from 'react';
import Immutable from 'immutable';
import thunk from 'redux-thunk';
import configureStore, { MockStoreCreator } from 'redux-mock-store';
import { mount, ReactWrapper } from 'enzyme';
import { Provider } from 'react-redux';
import { AccessLevels } from 'shared/types/permissionSchema';
import { UserRole } from 'shared/types/userSchema';
import { ClientUserSchema } from 'app/apiResponseTypes';
import { RelationshipsFormButtons } from '../RelationshipsFormButtons';

describe('RelationshipsFormButtons', () => {
  const middlewares = [thunk];
  const mockStoreCreator: MockStoreCreator<object> = configureStore<object>(middlewares);
  const adminUser = {
    email: 'admin1@relation.test',
    username: 'admin 1',
    _id: 'admin1',
    groups: [],
    role: UserRole.ADMIN,
  };
  const editorUser = {
    email: 'editor1@relation.test',
    username: 'editor 1',
    _id: 'editor1',
    groups: [],
    role: UserRole.EDITOR,
  };
  const collaboratorUser = {
    email: 'user1@relation.test',
    username: 'user 1',
    _id: 'user1',
    groups: [],
    role: UserRole.COLLABORATOR,
  };
  const otherCollaboratorUser = {
    email: 'user2@relation.test',
    username: 'user 2',
    _id: 'user2',
    groups: [],
    role: UserRole.COLLABORATOR,
  };
  let component: ReactWrapper;
  const defaultProps = {
    editing: true,
    saving: false,
    parentEntity: Immutable.fromJS({
      _id: 'entity1',
      permissions: [{ refId: collaboratorUser._id, level: AccessLevels.WRITE }],
    }),
    edit: jasmine.createSpy('edit'),
    save: () => {},
    searchResults: {},
  };

  const render = (user: ClientUserSchema, args: any = {}) => {
    const props = { ...defaultProps, ...args };
    component = mount(
      <Provider store={mockStoreCreator({ user: Immutable.fromJS(user) })}>
        <RelationshipsFormButtons {...props} />
      </Provider>
    );
  };

  describe('authorization', () => {
    it('should not show restricted actions if user does not have permissions on entity', () => {
      render(otherCollaboratorUser);
      const buttons = component.find('button');
      expect(buttons.length).toBe(0);
    });

    it.each([editorUser, adminUser, collaboratorUser])(
      'should show edit button if user has permissions on entity',
      (user: ClientUserSchema) => {
        render(user, { editing: false });
        const buttons = component.find('button');
        expect(buttons.length).toBe(1);
        expect(buttons.at(0).find('span').text()).toEqual('Edit');
      }
    );
    it.each([editorUser, adminUser, collaboratorUser])(
      'should show cancel and save actions if user has permissions on entity',
      (user: ClientUserSchema) => {
        render(user, { editing: true });
        const buttons = component.find('button');
        expect(buttons.length).toBe(2);
        expect(buttons.at(0).find('span').text()).toEqual('Cancel');
        expect(buttons.at(1).find('span').text()).toEqual('Save');
      }
    );
  });

  describe('componentWillUnmount', () => {
    it('should change edition mode to false', () => {
      render(editorUser, { editing: true });
      component.unmount();
      expect(defaultProps.edit).toHaveBeenCalledWith(false, {}, defaultProps.parentEntity);
    });
  });
});
