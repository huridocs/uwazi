/**
 * @jest-environment jsdom
 */
import React from 'react';
import Immutable from 'immutable';
import { screen } from '@testing-library/react';
import { defaultState, renderConnectedContainer } from 'app/utils/test/renderConnected';

import { Dashboard } from '../Dashboard';

describe('Dashboard', () => {
  let systenStats = {
    users: { total: 0, admin: 0, editor: 0, collaborator: 0 },
    entities: { total: 0 },
    files: { total: 0 },
    storage: { total: 0 },
  };

  beforeEach(() => {
    systenStats = {
      users: { total: 12, admin: 2, editor: 4, collaborator: 6 },
      entities: { total: 56327 },
      files: { total: 2500 },
      storage: { total: 45000 },
    };
  });

  const render = () => {
    const store = {
      ...defaultState,
      settings: { stats: Immutable.fromJS(systenStats) },
    };
    renderConnectedContainer(<Dashboard />, () => store);
  };

  describe('Users report', () => {
    it('should display the total number of users', () => {
      render();
      expect(screen.getByText('Total users').parentElement?.textContent).toBe('12 Total users');
    });

    it('should show a breakdown of user types and not show empty user types', () => {
      systenStats.users = { total: 3, admin: 1, editor: 2, collaborator: 0 };

      render();
      expect(screen.getByText('Total users').parentElement?.textContent).toBe('3 Total users');
      expect(screen.getByText('Admin').parentElement?.textContent).toBe('1 Admin');
      expect(screen.getByText('Editor').parentElement?.textContent).toBe('2 Editor');
      expect(screen.queryByText('Collaborator')).not.toBeInTheDocument();
    });
  });

  describe('Files report', () => {
    it('should show the total number of files', () => {
      render();
      expect(screen.getByText('Total files').parentElement?.textContent).toBe('2500 Total files');
    });
  });

  describe('Entities report', () => {
    it('should show the total number of files', () => {
      render();
      expect(screen.getByText('Total entities').parentElement?.textContent).toBe(
        '56327 Total entities'
      );
    });
  });

  describe('Storage report', () => {
    it.each`
      bytes                  | expectedValue
      ${0}                   | ${'0 Bytes'}
      ${null}                | ${'0 Bytes'}
      ${undefined}           | ${'0 Bytes'}
      ${-36654}              | ${'0 Bytes'}
      ${1000}                | ${'1000 Bytes'}
      ${'3456'}              | ${'3.38 KB'}
      ${5242880}             | ${'5 MB'}
      ${2764543491.243474}   | ${'2.57 GB'}
      ${'2764543491.243474'} | ${'2.57 GB'}
      ${6764573491.2}        | ${'6.3 GB'}
    `(
      'should show the expected formatted value of $expectedValue for $bytes bytes',
      ({ bytes, expectedValue }) => {
        systenStats.storage.total = bytes;
        render();
        expect(screen.getByText(expectedValue)).toBeInTheDocument();
      }
    );
  });
});
