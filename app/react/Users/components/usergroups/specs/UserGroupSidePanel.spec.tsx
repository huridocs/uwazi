/**
 * @jest-environment jsdom
 */
import 'mutationobserver-shim';
import Immutable from 'immutable';
import { SidePanel } from 'app/Layout';
import {
  UserGroupSidePanel,
  UserGroupSidePanelProps,
} from 'app/Users/components/usergroups/UserGroupSidePanel';
import { renderConnectedMount } from 'app/Templates/specs/utils/renderConnected';
import { ReactWrapper } from 'enzyme';
import React from 'react';
import MultiSelect from 'app/Forms/components/MultiSelect';

describe('UserGroupSidePanel', () => {
  const userGroup = {
    _id: 'group1Id',
    name: 'Group 1',
    members: [
      { _id: 'user1', username: 'martha perez' },
      { _id: 'user2', username: 'ana johnson' },
    ],
  };
  const defaultProps: UserGroupSidePanelProps = {
    users: [
      { _id: 'user1', username: 'martha perez' },
      { _id: 'user2', username: 'ana johnson' },
      { _id: 'user3', username: 'maria rodriguez' },
      { _id: 'user4', username: 'john smith' },
    ],
    userGroup,
    opened: true,
    userGroups: [{ ...userGroup }, { _id: 'group2Id', name: 'Group 2', members: [] }],
    closePanel: jasmine.createSpy('onClick'),
    onSave: jasmine.createSpy('onSave'),
    onDelete: jasmine.createSpy('onDelete'),
  };

  let component: ReactWrapper<React.Component['props'], React.Component['state'], React.Component>;

  function render(args?: UserGroupSidePanelProps) {
    const props = { ...defaultProps, ...args };
    const state = {
      locale: 'es',
      inlineEdit: Immutable.fromJS({ inlineEdit: true }),
      translations: Immutable.fromJS([{ _id: 1, locale: 'es', contexts: [] }]),
    };
    return renderConnectedMount(UserGroupSidePanel, state, props);
  }

  beforeEach(() => {
    component = render();
  });

  describe('Side panel opening', () => {
    it('should set SidePanel as open if opened prop is true', () => {
      const sidePanel = component.find(SidePanel);
      expect(sidePanel.props().open).toBe(true);
    });

    it('should call the closePanel method on Discard Changes button click', () => {
      component.find({ id: 'discardChangesBtn' }).simulate('click');
      expect(defaultProps.closePanel).toHaveBeenCalled();
    });
  });

  describe('Create user group', () => {
    it('should show creation labels', () => {
      const props = { ...defaultProps };
      props.userGroup = { name: 'NEW GROUP', members: [] };
      const wrapper = render(props);
      const header = wrapper.find('.sidepanel-header').find('Connect(Translate)');
      const submitBtn = wrapper.find('#submitLabel').find('Connect(Translate)');
      expect(header.props().children).toEqual('Add Group');
      expect(submitBtn.props().children).toEqual('Create Group');
      expect(wrapper.find('#deleteBtn').length).toBe(0);
    });

    it.each(['Group 1', ''])(
      'should not save if there is another group with the same name',
      (groupName: string) => {
        const props = { ...defaultProps };
        props.userGroup = { name: groupName, members: [] };
        const wrapper = render(props);
        wrapper.find('form').simulate('submit');
        expect(defaultProps.onSave).not.toBeCalled();
      }
    );
  });

  describe('Editing user group', () => {
    it('should show the name of the received group', () => {
      const nameInput = component.find({ id: 'name_field' }).find('input');
      expect(nameInput.props().value).toEqual(defaultProps.userGroup.name);
    });

    it('should show edition labels', () => {
      const header = component.find('.sidepanel-header').find('Connect(Translate)');
      const submitBtn = component.find('#submitLabel').find('Connect(Translate)');
      expect(header.props().children).toEqual('Edit Group');
      expect(submitBtn.props().children).toEqual('Save Group');
    });

    describe('User members', () => {
      it('should list all the available users sorted alphabetically', () => {
        const availableUsers = component.find(MultiSelect);
        expect(availableUsers.props().options).toEqual([
          { _id: 'user2', username: 'ana johnson' },
          { _id: 'user4', username: 'john smith' },
          { _id: 'user3', username: 'maria rodriguez' },
          { _id: 'user1', username: 'martha perez' },
        ]);
      });

      it('should pass as value the ids of group members', () => {
        expect(component.find(MultiSelect).props().value).toEqual(['user1', 'user2']);
      });

      it('should remove the user if its is unchecked', () => {
        const userToUncheck = component
          .find(MultiSelect)
          .find('input')
          .at(0);
        userToUncheck.simulate('change');
        const selectedUsers = component.find(MultiSelect).props().value;
        expect(selectedUsers).toEqual(['user1']);
      });
    });

    describe('Saving user group', () => {
      it('should call the save callback when save button is clicked', () => {
        const nameInput = component.find({ id: 'name_field' }).find('input');
        nameInput.simulate('change', { target: { value: 'GROUP 1' } });
        component.find('form').simulate('submit');
        setImmediate(() => {
          expect(defaultProps.onSave).toHaveBeenCalledWith({
            _id: 'group1Id',
            name: 'GROUP 1',
            members: [
              { _id: 'user1', username: 'martha perez' },
              { _id: 'user2', username: 'ana johnson' },
            ],
          });
        });
      });
    });
  });

  describe('Adding users to the group', () => {
    beforeEach(() => {
      const props = { ...defaultProps };
      // @ts-ignore
      props.users[2].using2fa = false;
      const userToCheck = component
        .find(MultiSelect)
        .find('input')
        .at(2);
      userToCheck.simulate('change');
    });

    it('should add a checked user to the selected users', () => {
      const selectedUsers = component.find(MultiSelect).props().value;
      expect(selectedUsers).toEqual(['user2', 'user4', 'user1']);
    });

    it('should save selected users with member properties', () => {
      component.find('form').simulate('submit');
      setImmediate(() => {
        expect(defaultProps.onSave).toHaveBeenCalledWith({
          _id: 'group1Id',
          name: 'Group 1',
          members: [
            { _id: 'user2', username: 'ana johnson' },
            { _id: 'user4', username: 'john smith' },
            { _id: 'user1', username: 'martha perez' },
          ],
        });
      });
    });
  });

  describe('Deleting user group', () => {
    it('should not call the delete callback when cancel deletion', () => {
      component.find({ id: 'deleteBtn' }).simulate('click');
      component.find('.cancel-button').simulate('click');
      expect(defaultProps.onDelete).not.toHaveBeenCalled();
    });

    it('should call the delete callback when confirm deletion', () => {
      component.find({ id: 'deleteBtn' }).simulate('click');
      component.find('.confirm-button').simulate('click');
      expect(defaultProps.onDelete).toHaveBeenCalledWith(defaultProps.userGroup);
    });
  });
});
