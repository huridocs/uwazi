/**
 * @jest-environment jsdom
 */
import 'mutationobserver-shim';
import React from 'react';
import { screen, act, fireEvent, waitFor } from '@testing-library/react';
import {
  UserGroupSidePanel,
  UserGroupSidePanelProps,
} from 'app/Users/components/usergroups/UserGroupSidePanel';
import { defaultState, renderConnectedContainer } from 'app/utils/test/renderConnected';

describe('UserGroupSidePanel', () => {
  const userGroup = {
    _id: 'group1Id',
    name: 'Group 1',
    members: [
      { refId: 'user1', username: 'martha perez' },
      { refId: 'user2', username: 'ana johnson' },
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
    closePanel: jasmine.createSpy('closePanel'),
    onSave: jasmine.createSpy('onSave'),
    onDelete: jasmine.createSpy('onDelete'),
  };
  function render(args?: UserGroupSidePanelProps) {
    const props = { ...defaultProps, ...args };
    return renderConnectedContainer(<UserGroupSidePanel {...props} />, () => defaultState);
  }
  describe('Side panel opening', () => {
    it('should set SidePanel as open if opened prop is true', async () => {
      render();
      expect(screen.queryByText('Name of the group')).toBeInTheDocument();
    });

    it('should call the closePanel method on Cancel button click', () => {
      render();
      const cancelButton = screen.getByText('Cancel').parentElement!;
      act(() => {
        fireEvent.click(cancelButton);
      });
      expect(defaultProps.closePanel).toHaveBeenCalled();
    });
  });

  describe('Create user group', () => {
    it('should show creation labels', () => {
      const props = { ...defaultProps };
      props.userGroup = { name: 'NEW GROUP', members: [] };
      render(props);
      expect(screen.queryByText('Add Group')).toBeInTheDocument();
      expect(screen.queryByText('Save')).toBeInTheDocument();
      expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    });

    it.each<any>([
      { field: 'name', value: userGroup.name, message: 'Duplicated name' },
      { field: 'name', value: '', message: 'Name is required' },
      { field: 'name', value: 'a'.repeat(55), message: 'Name is too long' },
      { field: 'name', value: 'a', message: 'Name is too short' },
    ])('should not save if there is an invalid value %s', async ({ field, value, message }) => {
      const props = { ...defaultProps };
      const newGroup = { name: 'NEW GROUP', members: [] };
      props.userGroup = { ...newGroup, [field]: value };
      render(props);
      act(() => {
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));
      });

      expect(defaultProps.onSave).not.toBeCalled();
      expect(await screen.findByText(message)).toBeInTheDocument();
    });
  });

  const checkGroupMembers = (expectedValues: Partial<HTMLInputElement>[]) => {
    const availableUsers = screen.getAllByRole('checkbox') as HTMLInputElement[];
    const groupMembers = availableUsers.values();

    expectedValues.forEach(option => {
      expect(groupMembers.next().value).toMatchObject(option);
    });
  };

  describe('Editing user group', () => {
    it('should show the name of the received group', () => {
      render();
      const nameInput = screen.getByRole('textbox') as HTMLInputElement;
      expect(nameInput.value).toEqual(userGroup.name);
    });

    it('should show edition labels', () => {
      render();
      expect(screen.queryByText('Cancel')).toBeInTheDocument();
      expect(screen.queryByText('Save')).toBeInTheDocument();
      expect(screen.queryByText('Delete')).toBeInTheDocument();
    });

    describe('User members', () => {
      it('should list all the available users sorted alphabetically', () => {
        render();
        const availableUsers = screen.getAllByRole('checkbox') as HTMLInputElement[];
        expect(availableUsers.map(user => user.labels![0].textContent)).toEqual([
          'ana johnson',
          'martha perez',
          'john smith',
          'maria rodriguez',
        ]);
      });

      it('should pass as value the ids of group members', () => {
        render();
        checkGroupMembers([
          { value: 'user2', checked: true },
          { value: 'user1', checked: true },
          { value: 'user4', checked: false },
          { value: 'user3', checked: false },
        ]);
      });

      it('should remove the user if its is unchecked', () => {
        render();
        const firstMember = screen.getByRole('checkbox', {
          name: 'ana johnson',
        }) as HTMLInputElement;

        fireEvent.click(firstMember);
        checkGroupMembers([
          { value: 'user1', checked: true },
          { value: 'user2', checked: false },
          { value: 'user4', checked: false },
          { value: 'user3', checked: false },
        ]);
      });
    });

    describe('Saving user group', () => {
      it('should call the save callback when save button is clicked', async () => {
        render();
        const nameInput = screen.getByRole('textbox') as HTMLInputElement;
        expect(nameInput.value).toEqual(userGroup.name);
        act(() => {
          fireEvent.change(nameInput, {
            target: { value: 'GROUP 1' },
          });
        });
        await waitFor(() => {
          fireEvent.click(screen.getByRole('button', { name: 'Save' }));
        });
        expect(defaultProps.onSave).toHaveBeenCalledWith({
          _id: 'group1Id',
          name: 'GROUP 1',
          members: [{ refId: 'user2' }, { refId: 'user1' }],
        });
      });
    });
  });

  describe('Adding users to the group', () => {
    beforeEach(() => {
      const props = { ...defaultProps };
      // @ts-ignore
      props.users[2].using2fa = false;
      render(props);
      const [, , userToCheck] = screen.getAllByRole('checkbox') as HTMLInputElement[];
      act(() => {
        fireEvent.click(userToCheck);
      });
    });

    it('should add a checked user to the selected users', () => {
      checkGroupMembers([
        { value: 'user2', checked: true },
        { value: 'user4', checked: true },
        { value: 'user1', checked: true },
        { value: 'user3', checked: false },
      ]);
    });

    it('should save the group with its members', async () => {
      await waitFor(() => {
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));
      });
      expect(defaultProps.onSave).toHaveBeenCalledWith({
        _id: 'group1Id',
        name: 'Group 1',
        members: [{ refId: 'user2' }, { refId: 'user4' }, { refId: 'user1' }],
      });
    });
  });

  describe('Deleting user group', () => {
    it('should not call the delete callback when cancel deletion', done => {
      render();
      act(() => {
        fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
      });

      setTimeout(() => {
        act(() => {
          fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
        });
        expect(defaultProps.onDelete).not.toHaveBeenCalled();
        done();
      }, 0);
    });

    it('should call the delete callback when confirm deletion', async () => {
      render();
      await waitFor(() => {
        fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
      });

      act(() => {
        fireEvent.click(screen.getByRole('button', { name: 'Accept' }));
      });
      expect(defaultProps.onDelete).toHaveBeenCalledWith(defaultProps.userGroup);
    });
  });
});
