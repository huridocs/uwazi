import React from 'react';
import { shallow } from 'enzyme';
import {
  UserGroupSidePanel,
  UserGroupSidePanelProps,
} from 'app/Users/components/usergroups/UserGroupSidePanel';
import { SidePanel } from 'app/Layout';

describe('UserGroupSidePanel', () => {
  const defaultProps: UserGroupSidePanelProps = {
    userGroup: { _id: 'group1Id', name: 'Group 1', members: [] },
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
    it('should be opened when opened prop is true', () => {
      const component = render();
      const sidePanel = component.find(SidePanel).at(0);
      expect(sidePanel.props().open).toBe(true);
    });
    /*
    it('should call the closePanel method on X button click', () => {
      const component = render();
      const closeButton = component.find('.closeSidepanel');
      closeButton.simulate('click');
      expect(defaultProps.closePanel).toHaveBeenCalled();
    });*/
  });
});
