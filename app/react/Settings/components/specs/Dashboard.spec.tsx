/**
 * @jest-environment jsdom
 */
import React from 'react';
import { screen } from '@testing-library/react';
import { defaultState, renderConnectedContainer } from 'app/utils/test/renderConnected';
import UsersAPI from 'app/Users/UsersAPI';
import { Dashboard } from '../Dashboard';

describe('Dashboard', () => {
  const render = () => {
    const store = {
      ...defaultState,
    };
    renderConnectedContainer(<Dashboard />, () => store);
  };

  describe('Users report', () => {
    it('should display the total number of users', async () => {
      jest.spyOn(UsersAPI, 'get').mockResolvedValueOnce([
        {
          username: 'admin',
          role: 'admin',
        },
      ]);

      render();

      expect((await screen.findByText('Total users')).parentElement?.textContent).toBe(
        '1 Total users'
      );
    });

    it('should show a breakdown of user types', async () => {
      jest.spyOn(UsersAPI, 'get').mockResolvedValueOnce([
        {
          username: 'admin',
          role: 'admin',
        },
        {
          username: 'editor 1',
          role: 'editor',
        },
        {
          username: 'editor 2',
          role: 'editor',
        },
      ]);

      render();

      expect((await screen.findByText('Total users')).parentElement?.textContent).toBe(
        '3 Total users'
      );

      expect((await screen.findByText('Admins')).parentElement?.textContent).toBe('1 Admins');
      expect((await screen.findByText('Editors')).parentElement?.textContent).toBe('2 Editors');
    });
  });
});
