/**
 * @jest-environment jsdom
 */
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
  const defaultProps: UserGroupSidePanelProps = {
    users: [
      { _id: 'user1', username: 'User 1' },
      { _id: 'user2', username: 'User 2' },
      { _id: 'user3', username: 'john smith' },
      { _id: 'user4', username: 'maria rodriguez' },
    ],
    userGroup: {
      _id: 'group1Id',
      name: 'Group 1',
      members: [
        { _id: 'user1', username: 'User 1' },
        { _id: 'user2', username: 'User 2' },
      ],
    },
    opened: true,
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
      const submitBtn = wrapper.find('#saveChangesBtn').find('Connect(Translate)');
      expect(header.props().children).toEqual('Add Group');
      expect(submitBtn.props().children).toEqual('Create Group');
      expect(wrapper.find('#deleteBtn').length).toBe(0);
    });
  });

  describe('Editing user group', () => {
    it('should show the name of the received group', () => {
      const nameInput = component.find({ id: 'name_field' }).find('input');
      expect(nameInput.props().value).toEqual(defaultProps.userGroup.name);
    });

    it('should show edition labels', () => {
      const header = component.find('.sidepanel-header').find('Connect(Translate)');
      const submitBtn = component.find('#saveChangesBtn').find('Connect(Translate)');
      expect(header.props().children).toEqual('Edit Group');
      expect(submitBtn.props().children).toEqual('Save Group');
    });

    describe('User members', () => {
      it('should list all the team members', () => {
        const members = component.find('.user-group-members').children();
        expect(members.length).toBe(2);
        expect(members.at(0).key()).toBe('user1');
        expect(members.at(1).key()).toBe('user2');
      });

      describe('Remove users', () => {
        beforeEach(() => {
          const user1Comparison = (node: any) => node.key() === 'user1';
          const memberDeleteBtn = component.findWhere(user1Comparison).find('button');
          memberDeleteBtn.simulate('click');
        });

        it('should remove the user if its remove button is clicked', () => {
          const members = component.find('.user-group-members').children();
          expect(members.length).toBe(1);
          expect(members.at(0).key()).toBe('user2');
        });

        it('should include the removed user into available users', () => {
          const availableUsers = component.find(MultiSelect);
          expect(availableUsers.props().options).toEqual([
            { _id: 'user1', username: 'User 1' },
            { _id: 'user3', username: 'john smith' },
            { _id: 'user4', username: 'maria rodriguez' },
          ]);
        });
      });
    });

    describe('Saving user group', () => {
      it('should call the save callback when save button is clicked', () => {
        const newName = 'GROUP 1';
        const nameInput = component.find({ id: 'name_field' }).find('input');
        nameInput.simulate('change', { target: { value: newName } });
        component.find('#saveChangesBtn').simulate('click');
        expect(defaultProps.onSave).toHaveBeenCalledWith({
          ...defaultProps.userGroup,
          name: newName,
        });
      });
    });
  });

  describe('Available users', () => {
    it('should list only users than are not members of groups', () => {
      const availableUsers = component.find(MultiSelect);
      expect(availableUsers.props().options).toEqual([
        { _id: 'user3', username: 'john smith' },
        { _id: 'user4', username: 'maria rodriguez' },
      ]);
    });
  });

  describe('Adding users to the group', () => {
    beforeEach(() => {
      const props = { ...defaultProps };
      // @ts-ignore
      props.users[2].using2fa = false;
      component = render(props);
      const availableUsers = component.find(MultiSelect);
      availableUsers.props().onChange([props.users[2]._id]);
      component.update();
    });

    it('should add the selected users to the member list', () => {
      const members = component.find('.user-group-members').children();
      expect(members.length).toBe(3);
      expect(members.at(2).key()).toBe('user3');
    });

    it('should save added user from available with member properties', () => {
      component.find('#saveChangesBtn').simulate('click');
      const updatedUserGroup = defaultProps.userGroup;
      updatedUserGroup.members.push({ _id: 'user3', username: 'john smith' });
      expect(defaultProps.onSave).toHaveBeenCalledWith(defaultProps.userGroup);
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
