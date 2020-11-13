import React from 'react';
import { shallow } from 'enzyme';
import {
  UserGroupSidePanel,
  UserGroupSidePanelProps,
} from 'app/Users/components/usergroups/UserGroupSidePanel';
import { SidePanel } from 'app/Layout';

describe('UserGroupSidePanel', () => {
  const defaultProps: UserGroupSidePanelProps = {
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
  };
  function render(args?: UserGroupSidePanelProps) {
    const props = { ...defaultProps, args };
    return shallow(
      <UserGroupSidePanel
        userGroup={props.userGroup}
        opened={props.opened}
        closePanel={props.closePanel}
        onSave={props.onSave}
      />
    );
  }
  describe('Side panel opening', () => {
    it('should set SidePanel as open if opened prop is true', () => {
      const component = render();
      const sidePanel = component.find(SidePanel).at(0);
      expect(sidePanel.props().open).toBe(true);
    });

    it('should call the closePanel method on Discard Changes button click', () => {
      const component = render();
      const discardChangesBtn = component.find({ id: 'discardChangesBtn' }).at(0);
      discardChangesBtn.simulate('click');
      expect(defaultProps.closePanel).toHaveBeenCalled();
    });
  });

  describe('Editing user group', () => {
    it('should show the name of the received group', () => {
      const component = render();
      const nameInput = component
        .find({ id: 'name_field' })
        .find('input')
        .at(0);
      expect(nameInput.props().value).toEqual(defaultProps.userGroup.name);
    });

    describe('User members', () => {
      it('should list all the team members', () => {
        const component = render();
        const members = component
          .find('.user-group-members')
          .at(0)
          .children();
        expect(members.length).toBe(2);
        expect(members.at(0).key()).toBe('user1');
        expect(members.at(1).key()).toBe('user2');
      });

      it('should remove the user if its remove button is clicked', () => {
        const component = render();
        const user1Comparison = (node: any) => node.key() === 'user1';
        const memberDeleteBtn = component.findWhere(user1Comparison).find('button');
        memberDeleteBtn.simulate('click');
        component.update();
        const members = component
          .find('.user-group-members')
          .at(0)
          .children();
        expect(members.length).toBe(1);
        expect(members.at(0).key()).toBe('user2');
      });
    });
  });
});
