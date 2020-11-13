/**
 * @jest-environment jsdom
 */
import React from 'react';
import Immutable from 'immutable';
import thunk from 'redux-thunk';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import { mount } from 'enzyme';
import { UserGroupSchema } from 'shared/types/userGroupType';
import { renderConnected } from 'app/Templates/specs/utils/renderConnected';
import { UserGroupList } from 'app/Users/components/usergroups/UserGroupList';
import { loadUserGroups, saveUserGroup } from 'app/Users/components/usergroups/actions/actions';
import UserGroups from 'app/Users/components/usergroups/UserGroups';
import { UserGroupSidePanel } from 'app/Users/components/usergroups/UserGroupSidePanel';

jest.mock('app/Users/components/usergroups/actions/actions', () => ({
  loadUserGroups: jest.fn().mockReturnValue(async () => Promise.resolve()),
  saveUserGroup: jest.fn().mockReturnValue(async () => Promise.resolve()),
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
  const storeState = {
    userGroups: Immutable.fromJS(userGroups),
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
    function renderWithMount(state: any) {
      const mockStoreCreator = configureStore([thunk]);
      const store = mockStoreCreator(state);
      mount(
        <Provider store={store}>
          <UserGroups />
        </Provider>
      );
    }
    it('Should fetch user groups if there are no groups loaded', () => {
      const state = { userGroups: Immutable.fromJS([]) };
      renderWithMount(state);
      expect(loadUserGroups).toHaveBeenCalledTimes(1);
    });
    it('Should fetch user groups if initial state of groups is undefined', () => {
      const state = {};
      renderWithMount(state);
      expect(loadUserGroups).toHaveBeenCalledTimes(2);
    });
  });
  describe('user group side panel', () => {
    let listComponent: any;
    beforeEach(() => {
      render();
      listComponent = component.find(UserGroupList).get(0);
    });
    describe('open existing group', () => {
      it('should pass to the side panel the received user group', () => {
        listComponent.props.handleSelect(userGroups[1]);
        component.update();
        const sidePanel = component.find(UserGroupSidePanel).get(0);
        expect(sidePanel.props.userGroup).toEqual(userGroups[1]);
        expect(sidePanel.props.opened).toEqual(true);
      });
    });
    describe('create new group', () => {
      it('should pass an empty new group to the side panel', () => {
        listComponent.props.handleAddGroup();
        component.update();
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
        component.update();
        const updatedSidePanel = component.find(UserGroupSidePanel);
        expect(updatedSidePanel.length).toEqual(0);
      });
    });
    describe('saving group', () => {
      it('should save the received user group', () => {
        listComponent.props.handleSelect(userGroups[1]);
        const updatedSidePanel = component.find(UserGroupSidePanel).get(0);
        updatedSidePanel.props.onSave(userGroups[1]);
        expect(saveUserGroup).toHaveBeenCalledWith(userGroups[1]);
      });
    });
  });
});
