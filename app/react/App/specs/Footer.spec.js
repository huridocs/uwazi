/**
 * @jest-environment jsdom
 */
import React from 'react';
import { screen } from '@testing-library/react';
import Immutable from 'immutable';
import { Footer } from '#app/App/Footer.js';
import { defaultState, renderConnectedContainer } from '#app/utils/test/renderConnected.js';

describe('Footer', () => {
  describe('Default library view', () => {
    it('should point the Library link to the correct view', () => {
      const storeState = {
        ...defaultState,
        user: Immutable.fromJS({ _id: 'userid' }),
        settings: {
          collection: Immutable.fromJS({
            site_name: 'site_name',
            defaultLibraryView: 'table',
          }),
        },
      };
      renderConnectedContainer(<Footer />, () => storeState, 'MemoryRouter');

      expect(screen.getByRole('link', { name: 'Library' })).toHaveAttribute(
        'href',
        '/en/library/table'
      );
    });
  });
});
