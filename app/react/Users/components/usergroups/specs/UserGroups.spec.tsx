/**
 * @jest-environment jsdom
 */
import Immutable from 'immutable';
import { UserGroupSchema } from 'shared/types/userGroupType';
import { renderConnected, renderConnectedMount } from 'app/Templates/specs/utils/renderConnected';
import { UserGroupList } from 'app/Users/components/usergroups/UserGroupList';
import { UserGroupSidePanel } from 'app/Users/components/usergroups/UserGroupSidePanel';
import UserGroups from 'app/Users/components/usergroups/UserGroups';
import {
  deleteUserGroup,
  loadUserGroups,
  saveUserGroup,
} from 'app/Users/components/usergroups/actions/actions';

jest.mock('app/Users/components/usergroups/actions/actions', () => ({
  loadUserGroups: jest.fn().mockReturnValue(async () => Promise.resolve()),
  saveUserGroup: jest.fn().mockReturnValue(async () => Promise.resolve()),
  deleteUserGroup: jest.fn().mockReturnValue(async () => Promise.resolve()),
}));

describe('UserGroups', () => {
  let component: any;
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
      expect(listComponent.props.userGroups).toEqual(userGroups);
    });
  });

  describe('mapDispatchToProps', () => {
    it('Should fetch user groups if there are no groups loaded', () => {
      const state = { userGroups: Immutable.fromJS([]) };
      renderConnectedMount(UserGroups, state);
      expect(loadUserGroups).toHaveBeenCalledTimes(1);
    });
    it('Should fetch user groups if initial state of groups is undefined', () => {
      const state = {};
      renderConnectedMount(UserGroups, state);
      expect(loadUserGroups).toHaveBeenCalledTimes(2);
    });
  });

  describe('user group side panel', () => {
    let listComponent: any;

    beforeEach(() => {
      render();
      listComponent = component.find(UserGroupList).get(0);
    });

    it('Should render the user list from state and pass to side panel', () => {
      listComponent.props.handleSelect(userGroups[1]);
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
        expect(component.find(UserGroupSidePanel).length).toEqual(0);
      });
    });

    describe('deleting group', () => {
      it('should delete the received user group', async () => {
        listComponent.props.handleSelect(userGroups[1]);
        const updatedSidePanel = component.find(UserGroupSidePanel).get(0);
        await updatedSidePanel.props.onDelete(userGroups[1]);
        expect(deleteUserGroup).toHaveBeenCalledWith(userGroups[1]);
        expect(component.find(UserGroupSidePanel).length).toEqual(0);
      });
    });
  });
});
