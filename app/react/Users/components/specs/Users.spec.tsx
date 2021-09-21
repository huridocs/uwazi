/**
 * @jest-environment jsdom
 */
import Immutable from 'immutable';
import { ReactElement } from 'react';
import { ShallowWrapper } from 'enzyme';
import { renderConnected, renderConnectedMount } from 'app/utils/test/renderConnected';
import { Users } from 'app/Users/components/Users';
import { UserList } from 'app/Users/components/UserList';
import { loadUsers, saveUser, deleteUser, newUser } from 'app/Users/actions/actions';
import { UserSidePanel } from 'app/Users/components/UserSidePanel';
import { reset2fa } from 'app/Auth2fa/actions/actions';
import { recoverPassword } from 'app/Auth/actions';
import { UserRole } from 'shared/types/userSchema';
import { UserSchema } from 'shared/types/userType';

jest.mock('app/Users/actions/actions', () => ({
  loadUsers: jest.fn().mockReturnValue(async () => Promise.resolve()),
  loadUserGroups: jest.fn().mockReturnValue(async () => Promise.resolve()),
  newUser: jest.fn().mockReturnValue(async () => Promise.resolve()),
  saveUser: jest.fn().mockReturnValue(async () => Promise.resolve()),
  deleteUser: jest.fn().mockReturnValue(async () => Promise.resolve()),
  reset2fa: jest.fn().mockReturnValue(async () => Promise.resolve()),
  recoverPassword: jest.fn().mockReturnValue(async () => Promise.resolve()),
}));

jest.mock('app/Auth2fa/actions/actions', () => ({
  reset2fa: jest.fn().mockReturnValue(async () => Promise.resolve()),
}));

jest.mock('app/Auth/actions', () => ({
  recoverPassword: jest.fn().mockReturnValue(async () => Promise.resolve()),
}));

jest.mock('app/Users/components/usergroups/actions/actions', () => ({
  loadUserGroups: jest.fn().mockReturnValue(async () => Promise.resolve()),
}));

describe('Users', () => {
  let component: ShallowWrapper;
  const users: UserSchema[] = [
    {
      _id: 'user1',
      username: 'User 1',
      email: 'user1@email.test',
      role: UserRole.EDITOR,
    },
    {
      _id: 'user2',
      username: 'User 2',
      email: 'user2@email.test',
      role: UserRole.EDITOR,
    },
  ];
  const storeState = {
    users: Immutable.fromJS(users),
  };
  function render() {
    component = renderConnected(Users, {}, storeState);
  }
  describe('mapStateToProps', () => {
    it('Should render the users from state', () => {
      render();
      const listComponent = component.find(UserList).get(0);
      expect(listComponent.props.users).toEqual(users);
    });
  });

  describe('mapDispatchToProps', () => {
    const renderWithTranslations = (state: any) => {
      renderConnectedMount(Users, state, {}, true);
    };

    it('Should fetch users if there are no users loaded', () => {
      const state = { users: Immutable.fromJS([]) };
      renderWithTranslations(state);
      expect(loadUsers).toHaveBeenCalledTimes(1);
    });
  });

  describe('user side panel', () => {
    let listComponent: ReactElement;
    beforeEach(() => {
      render();
      listComponent = component.find(UserList).get(0);
    });
    it('should pass the selected user to the side panel', () => {
      listComponent.props.handleSelect(users[1]);
      const sidePanel = component.find(UserSidePanel).get(0);
      expect(sidePanel.props.user).toEqual(users[1]);
    });

    describe('create new user', () => {
      it('should pass an empty new user to the side panel', () => {
        listComponent.props.handleAddUser();
        const sidePanel = component.find(UserSidePanel).get(0);
        expect(sidePanel.props.user).toEqual({ role: 'collaborator', email: '', username: '' });
        expect(sidePanel.props.opened).toEqual(true);
      });
    });

    describe('create a user', () => {
      it('should save the received user data', async () => {
        listComponent.props.handleAddUser();
        const userToSave = {
          name: 'new user name',
          email: 'newuser@email.test',
          role: UserRole.ADMIN,
        };
        const updatedSidePanel = component.find(UserSidePanel).get(0);
        await updatedSidePanel.props.onSave(userToSave);
        expect(newUser).toHaveBeenCalledWith(userToSave);
        expect(component.find(UserSidePanel).length).toEqual(0);
      });
    });

    describe('save a user', () => {
      it('should save the received user data', async () => {
        listComponent.props.handleSelect(users[1]);
        const userToSave = { ...users[1], name: 'User 1 updated' };
        const updatedSidePanel = component.find(UserSidePanel).get(0);
        await updatedSidePanel.props.onSave(userToSave);
        expect(saveUser).toHaveBeenCalledWith(userToSave);
        expect(component.find(UserSidePanel).length).toEqual(0);
      });
    });

    describe('delete a user', () => {
      it('should delete the received user data', async () => {
        listComponent.props.handleSelect(users[1]);
        const updatedSidePanel = component.find(UserSidePanel).get(0);
        await updatedSidePanel.props.onDelete(users[1]);
        expect(deleteUser).toHaveBeenCalledWith({ _id: users[1]._id });
        expect(component.find(UserSidePanel).length).toEqual(0);
      });
    });

    describe('reset 2FA', () => {
      it('should call reset2fa action for selected user', async () => {
        listComponent.props.handleSelect(users[1]);
        const updatedSidePanel = component.find(UserSidePanel).get(0);
        await updatedSidePanel.props.onReset2fa(users[1]);
        expect(reset2fa).toHaveBeenCalledWith(users[1]);
      });
    });

    describe('reset Password', () => {
      it('should call resetPassword action for selected user', async () => {
        listComponent.props.handleSelect(users[1]);
        const updatedSidePanel = component.find(UserSidePanel).get(0);
        await updatedSidePanel.props.onResetPassword(users[1]);
        expect(recoverPassword).toHaveBeenCalledWith(users[1].email, expect.any(String));
      });
    });
  });
});
