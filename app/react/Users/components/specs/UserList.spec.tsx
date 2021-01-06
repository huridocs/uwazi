import React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { Pill } from 'app/Metadata/components/Pill';
import { UserSchema } from 'shared/types/userType';
import { UserRole } from 'shared/types/userSchema';
import { UserList, UserListProps } from '../UserList';

describe('UserList', () => {
  let component: ShallowWrapper;
  const user2 = { _id: 'user2', username: 'User 2', using2fa: false };
  const users: UserSchema[] = [
    {
      _id: 'user1',
      username: 'User 1',
      role: UserRole.EDITOR,
      using2fa: true,
      groups: [
        { _id: 'group1', name: 'Group1' },
        { _id: 'group1', name: 'Group2' },
      ],
    },
    user2,
    { _id: 'user3', username: 'User 3' },
  ];
  const defaultProps: UserListProps = {
    users,
    handleSelect: jasmine.createSpy('onClick'),
    handleAddUser: jasmine.createSpy('onClick'),
    className: 'edition-mode',
  };

  describe('List of users', () => {
    beforeEach(() => {
      component = shallow(<UserList {...defaultProps} />);
    });
    it('Should list all existing users into a table', () => {
      const rows = component.find('tbody > tr');
      expect(rows.length).toBe(3);
      const columns = rows.at(0).find('td');
      expect(columns.at(0).props().children).toEqual('User 1');
      expect(
        columns
          .at(1)
          .find(Pill)
          .at(0)
          .props().children
      ).toBe('Password + 2FA');
      expect(
        columns
          .at(2)
          .find(Pill)
          .at(0)
          .props().children
      ).toBe('editor');
      expect(
        columns
          .at(3)
          .find(Pill)
          .children()
          .at(1)
          .text()
      ).toBe('Group1');
      expect(
        columns
          .at(3)
          .find(Pill)
          .children()
          .at(3)
          .text()
      ).toBe('Group2');
    });

    it('should call handleSelect when a row is clicked', () => {
      const row = component.find('tbody > tr').at(1);
      row.simulate('click');
      expect(defaultProps.handleSelect).toHaveBeenCalledWith(user2);
    });
  });
});
