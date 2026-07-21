/**
 * @jest-environment jsdom
 */
import { screen, waitFor } from '@testing-library/react';
import { templatesAtom } from '#V2/atoms/index.js';
import { ThesauriList } from '#V2/Routes/Settings/Thesauri/ThesauriList.js';
import { createThesauriLoader } from '#V2/Routes/Settings/Thesauri/createThesauriLoader.js';
import { Users } from '#V2/Routes/Settings/Users/Users.js';
import { createUsersLoader } from '#V2/Routes/Settings/Users/createUsersLoader.js';
import { createTestServices } from '#V2/testing/createTestServices.js';
import { renderRoute } from '#V2/testing/renderRoute.js';
import { thesauri } from '#V2/Routes/Settings/Thesauri/specs/fixtures.js';
import { groups, users } from '#V2/Routes/Settings/Users/specs/fixtures.js';

describe('V2 services infrastructure', () => {
  it('loads ThesauriList via createThesauriLoader with injected services', async () => {
    const getAllMock = jest.fn().mockResolvedValue([thesauri, undefined]);

    renderRoute({
      Component: ThesauriList,
      createLoader: services => createThesauriLoader(services)({}),
      services: { thesauri: { getAll: getAllMock } },
      atomInitialValues: [[templatesAtom, []]],
    });

    await waitFor(() => {
      expect(screen.getByTestId('settings-thesauri')).toBeInTheDocument();
    });

    expect(getAllMock).toHaveBeenCalledWith({ headers: {} });
    expect(screen.getByTestId('thesauri')).toHaveTextContent('Colors');
    expect(screen.getByTestId('thesauri')).toHaveTextContent('Names');
  });

  it('createTestServices merges partial overrides with defaults', () => {
    const upsertMock = jest.fn();
    const getAllMock = jest.fn();
    const testServices = createTestServices({
      entities: { upsert: upsertMock },
      thesauri: { getAll: getAllMock },
    });

    expect(testServices.entities.upsert).toBe(upsertMock);
    expect(testServices.thesauri.getAll).toBe(getAllMock);
    expect(typeof testServices.thesauri.upsert).toBe('function');
    expect(typeof testServices.users.getAll).toBe('function');
  });

  it('loads Users via createUsersLoader with injected services', async () => {
    const getAllUsersMock = jest.fn().mockResolvedValue([users, undefined]);
    const getAllGroupsMock = jest.fn().mockResolvedValue([groups, undefined]);

    renderRoute({
      Component: Users,
      createLoader: services => createUsersLoader(services)({}),
      services: {
        users: { getAll: getAllUsersMock },
        userGroups: { getAll: getAllGroupsMock },
      },
    });

    await waitFor(() => {
      expect(screen.getByTestId('settings-users')).toBeInTheDocument();
    });

    expect(getAllUsersMock).toHaveBeenCalledWith({ headers: {} });
    expect(getAllGroupsMock).toHaveBeenCalledWith({ headers: {} });
    expect(screen.getByRole('table')).toHaveTextContent('admin');
    expect(screen.getByRole('table')).toHaveTextContent('editor');
  });
});
