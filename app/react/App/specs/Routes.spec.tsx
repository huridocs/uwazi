/**
 * @jest-environment jsdom
 */
import React from 'react';
import { getIndexElement } from 'app/getIndexElement';
import { Settings } from 'shared/types/settingsType';
import { Login } from 'app/Users/Login';
import { LibraryTable } from 'app/Library/LibraryTable';

let settings: Settings;
let userId: string;

describe('Routes', () => {
  beforeEach(() => {
    settings = { home_page: '', defaultLibraryView: 'table', private: false };
    userId = 'user1';
  });

  describe('getIndexElement', () => {
    it('should navigate to the library when there is a user', () => {
      const result = getIndexElement(settings, userId);
      expect(result.props.to).toBe('/library/?q=(includeUnpublished:!t)');
      expect(result.props.state).toMatchObject({ isClient: true });
    });

    describe('not logged user', () => {
      it('should go to login if there is not a user and the instance is private', () => {
        settings.private = true;
        const result = getIndexElement(settings, undefined);
        expect(result).toMatchObject(<Login />);
      });

      it('should replace the route to the default library if there is not user', () => {
        const result = getIndexElement(settings, undefined);
        expect(result).toMatchObject(<LibraryTable />);
      });
    });
  });
});
