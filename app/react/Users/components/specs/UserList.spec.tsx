import React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { UserSchema } from 'shared/types/userType';
import { UserRole } from 'shared/types/userSchema';
import { Translate } from 'app/I18N';
import { Pill } from 'app/Metadata/components/Pill';
import { UserList, UserListProps } from '../UserList';

describe('UserList', () => {
  let component: ShallowWrapper;

  const users: UserSchema[] = [
    {
      _id: 'user1',
      username: 'Juan Gonzales',
      role: UserRole.EDITOR,
      using2fa: false,
      email: 'mail@test.test',
      groups: [{ _id: 'group2', name: 'Group2' }],
    },
    {
      _id: 'user2',
      username: 'Ana Brown',
      using2fa: true,
      role: UserRole.EDITOR,
      email: 'mail@test.test',
      groups: [
        { _id: 'group1', name: 'Group1' },
        { _id: 'group2', name: 'Group2' },
      ],
    },
    { _id: 'user3', username: 'User 3', role: UserRole.EDITOR, email: 'mail@test.test' },
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
    it('Should list all existing users into a table ordered by username', () => {
      const rows = component.find('tbody > tr');
      expect(rows.length).toBe(3);
      const columns = rows.at(0).find('td');
      expect(columns.at(0).props().children).toEqual('Ana Brown');
      expect(columns.at(1).find(Pill).at(0).props().children).toContain(' + 2FA');
      expect(columns.at(2).find(Translate).props().children).toBe('editor');
      expect(columns.at(3).find(Pill).children().at(1).text()).toBe(' Group1');
      expect(columns.at(3).find(Pill).children().at(3).text()).toBe(' Group2');
    });

    it('should call handleSelect when a row is clicked', () => {
      const row = component.find('tbody > tr').at(1);
      expect(row.props().className).toBe('');
      row.simulate('click');
      component.update();
      expect(defaultProps.handleSelect).toHaveBeenCalledWith(users[1]);
      const updatedRow = component.find('tbody > tr').at(1);
      expect(updatedRow.props().className).toBe('selected');
    });
  });
});
