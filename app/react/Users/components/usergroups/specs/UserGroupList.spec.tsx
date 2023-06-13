import React from 'react';
import { shallow } from 'enzyme';
import { UserGroupList, UserGroupListProps } from 'app/Users/components/usergroups/UserGroupList';
import { Pill } from 'app/Metadata/components/Pill';
import { ClientUserGroupSchema } from 'app/apiResponseTypes';

describe('UserGroupList', () => {
  const group1: ClientUserGroupSchema = {
    _id: 'group1Id',
    name: 'Group 1',
    members: [
      { refId: 'user1', username: 'user 1' },
      { refId: 'user2', username: 'user 2' },
    ],
  };
  const defaultProps: UserGroupListProps = {
    userGroups: [group1, { _id: 'group2Id', name: 'Group 2', members: [] }],
    handleSelect: jasmine.createSpy('onClick'),
    handleAddGroup: jasmine.createSpy('onClick'),
    className: 'edition-mode',
  };
  function render(args?: UserGroupListProps) {
    const props = { ...defaultProps, ...args };
    return shallow(
      <UserGroupList
        userGroups={props.userGroups}
        handleSelect={props.handleSelect}
        handleAddGroup={props.handleAddGroup}
        className={props.className}
      />
    );
  }
  describe('List of groups', () => {
    it('should list all existing groups into a table', () => {
      const component = render();
      const rows = component.find('tbody > tr');
      expect(rows.length).toBe(2);
      const columns = rows.at(0).find('td');
      expect(columns.at(0).props().children).toEqual('Group 1');
      const membersColumn = columns.find(Pill).at(0).children().at(1);
      expect(membersColumn.text()).toEqual(' 2');
      const table = component.find('table');
      expect(table.get(0).props.className).toEqual('edition-mode');
    });
    it('should call handleSelect on click over a row', () => {
      const component = render();
      const row = component.find('tbody > tr').at(0);
      expect(row.hasClass('selected')).toBe(false);
      row.simulate('click');
      expect(defaultProps.handleSelect).toHaveBeenCalledWith(group1);
      component.update();
      const updatedRow = component.find('tbody > tr').at(0);
      expect(updatedRow.hasClass('selected')).toBe(true);
    });
  });
  describe('Add groups', () => {
    it('should open side panel with an empty creation form', () => {
      const component = render();
      component.find('.settings-footer > button').simulate('click');
      expect(defaultProps.handleAddGroup).toHaveBeenCalledWith();
      expect(component.find('.settings-footer.edition-mode').length).toBe(1);
    });
  });
});
