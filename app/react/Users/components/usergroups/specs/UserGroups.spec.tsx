/**
 * @jest-environment jsdom
 */
import Immutable from 'immutable';
import { ReactElement } from 'react';
import { ShallowWrapper } from 'enzyme';
import { UserGroupSchema } from 'shared/types/userGroupType';
import { renderConnected, renderConnectedMount } from 'app/utils/test/renderConnected';
import { UserGroupList } from 'app/Users/components/usergroups/UserGroupList';
import { UserGroupSidePanel } from 'app/Users/components/usergroups/UserGroupSidePanel';
import { loadUsers } from 'app/Users/actions/actions';
import {
  deleteUserGroup,
  loadUserGroups,
  saveUserGroup,
} from 'app/Users/components/usergroups/actions/actions';
import { UserGroups } from 'app/Users/components/usergroups/UserGroups';

jest.mock('app/Users/components/usergroups/actions/actions', () => ({
  loadUserGroups: jest.fn().mockReturnValue(async () => Promise.resolve()),
  saveUserGroup: jest.fn().mockReturnValue(async () => Promise.resolve()),
  deleteUserGroup: jest.fn().mockReturnValue(async () => Promise.resolve()),
}));

jest.mock('app/Users/actions/actions', () => ({
  loadUsers: jest.fn().mockReturnValue(async () => Promise.resolve()),
}));

describe('UserGroups', () => {
  let component: ShallowWrapper;
  const userGroups: UserGroupSchema[] = [
    {
      _id: 'group1',
      name: 'Group 1',
      members: [],
    },
    {
      _id: 'group2',
      name: 'Group 2',
      members: [],
    },
  ];
  const users = [{ _id: 'user1', username: 'User 1' }];
  const storeState = {
    userGroups: Immutable.fromJS(userGroups),
    users: Immutable.fromJS(users),
  };

  function render() {
    component = renderConnected(UserGroups, {}, storeState);
  }

  describe('mapStateToProps', () => {
    it('Should render the user groups from state', () => {
      render();
      const listComponent = component.find(UserGroupList).get(0);
      expect(listComponent.props.className).toEqual('');
      expect(listComponent.props.userGroups).toEqual(userGroups);
    });
  });

  describe('mapDispatchToProps', () => {
    const renderWithTranslations = (state: any) => {
      renderConnectedMount(UserGroups, state, {}, true);
    };

    it('Should fetch user groups if there are no groups loaded', () => {
      const state = { userGroups: Immutable.fromJS([]) };
      renderWithTranslations(state);
      expect(loadUserGroups).toHaveBeenCalledTimes(1);
    });
    it('Should fetch user groups if initial state of groups is undefined', () => {
      const state = {};
      renderWithTranslations(state);
      expect(loadUserGroups).toHaveBeenCalledTimes(2);
    });
  });

  describe('user group side panel', () => {
    let listComponent: ReactElement;

    beforeEach(() => {
      render();
      listComponent = component.find(UserGroupList).get(0);
    });

    it('Should render the user list from state and pass to side panel', () => {
      listComponent.props.handleSelect(userGroups[1]);
      const updatedList = component.find(UserGroupList).get(0);
      expect(updatedList.props.className).toEqual('with-sidepanel');
      const sidePanel = component.find(UserGroupSidePanel).get(0);
      expect(sidePanel.props.users).toEqual(users);
    });

    describe('open existing group', () => {
      it('should pass to the side panel the received user group', () => {
        listComponent.props.handleSelect(userGroups[1]);
        const sidePanel = component.find(UserGroupSidePanel).get(0);
        expect(sidePanel.props.userGroup).toEqual(userGroups[1]);
        expect(sidePanel.props.opened).toEqual(true);
      });
    });

    describe('create new group', () => {
      it('should pass an empty new group to the side panel', () => {
        listComponent.props.handleAddGroup();
        const sidePanel = component.find(UserGroupSidePanel).get(0);
        expect(sidePanel.props.userGroup).toEqual({ name: '', members: [] });
        expect(sidePanel.props.opened).toEqual(true);
      });
    });

    describe('closing panel', () => {
      it('should hide side panel if opened param is false', () => {
        listComponent.props.handleSelect(userGroups[1]);
        const sidePanel = component.find(UserGroupSidePanel).get(0);
        sidePanel.props.closePanel();
        const updatedSidePanel = component.find(UserGroupSidePanel);
        expect(updatedSidePanel.length).toEqual(0);
      });
    });

    describe('saving group', () => {
      it('should save the received user group', async () => {
        listComponent.props.handleSelect(userGroups[1]);
        const groupToSave = { ...userGroups[1], name: 'new name' };
        const updatedSidePanel = component.find(UserGroupSidePanel).get(0);
        await updatedSidePanel.props.onSave(groupToSave);
        expect(saveUserGroup).toHaveBeenCalledWith(groupToSave);
        expect(loadUsers).toHaveBeenCalledWith();
        expect(component.find(UserGroupSidePanel).length).toEqual(0);
      });
    });

    describe('deleting group', () => {
      it('should delete the received user group', async () => {
        listComponent.props.handleSelect(userGroups[1]);
        const updatedSidePanel = component.find(UserGroupSidePanel).get(0);
        await updatedSidePanel.props.onDelete(userGroups[1]);
        expect(deleteUserGroup).toHaveBeenCalledWith(userGroups[1]);
        expect(loadUsers).toHaveBeenCalledWith();
        expect(component.find(UserGroupSidePanel).length).toEqual(0);
      });
    });
  });
});
