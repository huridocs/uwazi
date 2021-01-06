/**
 * @jest-environment jsdom
 */
import Immutable from 'immutable';
import { ReactElement } from 'react';
import { ShallowWrapper } from 'enzyme';
import { GroupMemberSchema } from 'shared/types/userGroupType';
import { renderConnected, renderConnectedMount } from 'app/Templates/specs/utils/renderConnected';
import { Users } from 'app/Users/components/Users';
import { UserList } from 'app/Users/components/UserList';
import { loadUsers, saveUser, deleteUser } from 'app/Users/actions/actions';
import { UserSidePanel } from 'app/Users/components/UserSidePanel';

jest.mock('app/Users/actions/actions', () => ({
  loadUsers: jest.fn().mockReturnValue(async () => Promise.resolve()),
  saveUser: jest.fn().mockReturnValue(async () => Promise.resolve()),
  deleteUser: jest.fn().mockReturnValue(async () => Promise.resolve()),
}));

describe('Users', () => {
  let component: ShallowWrapper;
  const users: GroupMemberSchema[] = [
    {
      _id: 'user1',
      username: 'User 1',
    },
    {
      _id: 'user2',
      username: 'User 2',
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
      const defaultState = {
        locale: 'en',
        inlineEdit: Immutable.fromJS({ inlineEdit: true }),
        translations: Immutable.fromJS([
          {
            locale: 'en',
            contexts: [],
          },
        ]),
      };
      const stateToMap = { ...defaultState, state };
      renderConnectedMount(Users, stateToMap);
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
        expect(sidePanel.props.user).toEqual({ role: 'collaborator' });
        expect(sidePanel.props.opened).toEqual(true);
      });
    });

    describe('save a user', () => {
      it('should save the received user data', async () => {
        listComponent.props.handleSelect(users[1]);
        const userToSave = { ...users[1], name: 'new user name' };
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
        expect(deleteUser).toHaveBeenCalledWith(users[1]);
        expect(component.find(UserSidePanel).length).toEqual(0);
      });
    });
  });
});
