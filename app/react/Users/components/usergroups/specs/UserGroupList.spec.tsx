import React from 'react';
import { shallow } from 'enzyme';
import { UserGroupList, UserGroupListProps } from 'app/Users/components/usergroups/UserGroupList';

describe('UserGroupList', () => {
  function render(args?: UserGroupListProps) {
    const defaultProps: UserGroupListProps = {
      userGroups: [
        { _id: 'group1Id', name: 'Group 1', members: [] },
        { _id: 'group2Id', name: 'Group 2', members: [] },
      ],
    };
    const props = { ...defaultProps, args };
    return shallow(<UserGroupList userGroups={props.userGroups} />);
  }
  describe('List of groups', () => {
    it('should list all existing groups into a table', () => {
      const component = render();
      const rows = component.find('tbody > tr');
      expect(rows.length).toBe(2);
    });
  });
});
