/**
 * @jest-environment jsdom
 */
import type { LoaderFunctionArgs } from 'react-router';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react/pure';
import { Users } from '../Users.js';
import { createUsersLoader } from '../createUsersLoader.js';
import { createTestServices } from '#V2/testing/createTestServices.js';
import { renderRoute } from '#V2/testing/renderRoute.js';
import type { Group, User } from '../types.js';
import { createUsersSettingsTree } from './mountUsersSettings.js';
import { groups, users } from './fixtures.js';

describe('Settings Users', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(jest.fn());
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  describe('createUsersLoader', () => {
    it('returns users and groups with rowId', async () => {
      const getAllUsersMock = jest.fn().mockResolvedValue([users, undefined]);
      const getAllGroupsMock = jest.fn().mockResolvedValue([groups, undefined]);
      const testServices = createTestServices({
        users: { getAll: getAllUsersMock },
        userGroups: { getAll: getAllGroupsMock },
      });

      const result = (await createUsersLoader(testServices)({})({
        params: {},
        request: new Request('http://test/settings/users'),
        context: {},
      } as unknown as LoaderFunctionArgs)) as { users: User[]; groups: Group[] };

      expect(getAllUsersMock).toHaveBeenCalledWith({ headers: {} });
      expect(getAllGroupsMock).toHaveBeenCalledWith({ headers: {} });
      expect(result.users[0].rowId).toBe('user1');
      expect(result.groups[0].rowId).toBe('group1');
    });
  });

  describe('Users list', () => {
    it('renders users from the loader', async () => {
      renderRoute({
        Component: Users,
        createLoader: services => createUsersLoader(services)({}),
        services: {
          users: { getAll: jest.fn().mockResolvedValue([users, undefined]) },
          userGroups: { getAll: jest.fn().mockResolvedValue([groups, undefined]) },
        },
      });

      await waitFor(() => {
        expect(screen.getByTestId('settings-users')).toBeInTheDocument();
      });

      expect(screen.getByRole('table')).toHaveTextContent('admin');
      expect(screen.getByRole('table')).toHaveTextContent('editor');
    });

    it('deletes selected users and revalidates the list', async () => {
      const { tree, users: usersService } = createUsersSettingsTree();
      render(tree);

      await waitFor(() => {
        expect(screen.getByRole('table')).toHaveTextContent('admin');
      });

      const adminRow = screen.getByRole('row', { name: /admin/i });
      const checkbox = within(adminRow as HTMLElement).getByRole('checkbox');
      fireEvent.click(checkbox);

      fireEvent.click(screen.getByRole('button', { name: /Delete/i }));

      const modal = await screen.findByTestId('modal');
      const passwordInput = within(modal).getByLabelText(/Enter your current password/i);
      fireEvent.change(passwordInput, { target: { value: 'admin' } });
      fireEvent.click(within(modal).getByTestId('accept-button'));

      await waitFor(() => {
        expect(usersService.snapshotUsers().map(user => user.username)).toEqual(['editor']);
      });
    });
  });
});
