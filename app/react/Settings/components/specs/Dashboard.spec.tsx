/**
 * @jest-environment jsdom
 */
import React from 'react';
import { screen } from '@testing-library/react';
import { defaultState, renderConnectedContainer } from 'app/utils/test/renderConnected';
import { Dashboard, dummyapi } from '../Dashboard';

describe('Dashboard', () => {
  const render = () => {
    const store = {
      ...defaultState,
    };
    renderConnectedContainer(<Dashboard />, () => store);
  };

  let apiResposne = {
    users: { total: 0, admin: 0, editor: 0, collaborator: 0 },
    entities: { total: 0 },
    files: { total: 0 },
    storage: { total: 0, available: 0 },
  };

  beforeEach(() => {
    apiResposne = {
      users: { total: 12, admin: 2, editor: 4, collaborator: 6 },
      entities: { total: 56327 },
      files: { total: 2500 },
      storage: { total: 45000, available: 100000 },
    };

    jest.spyOn(dummyapi, 'get').mockResolvedValue(apiResposne);
  });

  describe('Users report', () => {
    it('should display the total number of users', async () => {
      render();

      expect((await screen.findByText('Total users')).parentElement?.textContent).toBe(
        '12 Total users'
      );
    });

    it('should show a breakdown of user types and not show empty user types', async () => {
      apiResposne.users = { total: 3, admin: 1, editor: 2, collaborator: 0 };

      render();

      expect((await screen.findByText('Total users')).parentElement?.textContent).toBe(
        '3 Total users'
      );

      expect((await screen.findByText('Admin')).parentElement?.textContent).toBe('1 Admin');
      expect((await screen.findByText('Editor')).parentElement?.textContent).toBe('2 Editor');
      expect(screen.queryByText('Collaborator')).not.toBeInTheDocument();
    });
  });

  describe('Files report', () => {
    it('should show the total number of files', async () => {
      render();

      expect((await screen.findByText('Total files')).parentElement?.textContent).toBe(
        '2500 Total files'
      );
    });
  });

  describe('Entities report', () => {
    it('should show the total number of files', async () => {
      render();

      expect((await screen.findByText('Total entities')).parentElement?.textContent).toBe(
        '56327 Total entities'
      );
    });
  });

  describe('Storage report', () => {
    it('should show the amount of store used out of the total', async () => {
      render();

      expect((await screen.findByText('100 GB')).parentElement?.textContent).toBe('45 GB 100 GB');
    });
  });
});
