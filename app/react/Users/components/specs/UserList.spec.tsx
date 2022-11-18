/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, screen, within } from '@testing-library/react';
import { ClientUserSchema } from 'app/apiResponseTypes';
import { UserRole } from 'shared/types/userSchema';
import { defaultState, renderConnectedContainer } from 'app/utils/test/renderConnected';
import { UserList, UserListProps } from '../UserList';

describe('UserList', () => {
  const users: ClientUserSchema[] = [
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
      renderConnectedContainer(<UserList {...defaultProps} />, () => defaultState);
    });
    it('Should list all existing users into a table ordered by username', () => {
      const rows = screen.getAllByRole('row');
      expect(rows.length).toBe(4);
      const columns = within(rows[1]).getAllByRole('cell');
      expect(columns[0].textContent).toEqual('Ana Brown');
      expect(columns[1].textContent).toEqual('Password + 2FA');
      expect(columns[2].textContent).toEqual('editor');
      expect(columns[3].textContent).toEqual(' Group1 Group2');
    });

    it('should call handleSelect when a row is clicked', () => {
      const rows = screen.getAllByRole('row');
      //expect(rows[0].className).toBe('');
      fireEvent.click(rows[2]);
      expect(defaultProps.handleSelect).toHaveBeenCalledWith(users[1]);
      const updatedRow = screen.getAllByRole('row')[2];
      expect(updatedRow.className).toBe('selected');
    });
  });
});
