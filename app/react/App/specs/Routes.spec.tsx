/**
 * @jest-environment jsdom
 */
import React from 'react';
import { getIndexElement } from 'app/getIndexElement';
import { Settings } from 'shared/types/settingsType';
import { Login } from 'app/Users/Login';
import { LibraryTable } from 'app/Library/LibraryTable';
import { PageView } from 'app/Pages/PageView';

let settings: Settings;
let userId: string;

describe('Routes', () => {
  beforeEach(() => {
    settings = { home_page: '', defaultLibraryView: 'table', private: false };
    userId = 'user1';
  });

  describe('getIndexElement', () => {
    it('should navigate to the library when there is a user', () => {
      const { element, parameters } = getIndexElement(settings, userId);
      expect(element.props.to).toBe('/library/?q=(includeUnpublished:!t)');
      expect(element.props.state).toMatchObject({ isClient: true });
      expect(parameters).toBeUndefined();
    });

    it('should return the custom home page sharedId', () => {
      settings.home_page = '/page/bnrkwvu2zlb/custom-home-page';
      const { element, parameters } = getIndexElement(settings, userId);
      expect(element).toMatchObject(<PageView params={{ sharedId: 'bnrkwvu2zlb' }} />);
      expect(parameters).toMatchObject({ sharedId: 'bnrkwvu2zlb' });
    });

    it('should redirect to library if the custom homepage is incorrect', () => {
      settings.home_page = '/incorrect/page';
      const { element, parameters } = getIndexElement(settings, userId);
      expect(parameters).toBeUndefined();
      expect(element.props.to).toBe('/library/?q=(includeUnpublished:!t)');
    });

    describe('not logged user', () => {
      it('should go to login if there is not a user and the instance is private', () => {
        settings.private = true;
        const { element, parameters } = getIndexElement(settings, undefined);
        expect(element).toMatchObject(<Login />);
        expect(parameters).toBeUndefined();
      });

      it('should replace the route to the default library if there is no user', () => {
        const { element, parameters } = getIndexElement(settings, undefined);
        expect(element).toMatchObject(<LibraryTable />);
        expect(parameters).toBeUndefined();
      });

      it('should still redirect to the custom homepage', () => {
        settings.private = true;
        settings.home_page = '/page/bnrkwvu2zlb/custom-home-page';
        const { element, parameters } = getIndexElement(settings, userId);
        expect(element).toMatchObject(<PageView params={{ sharedId: 'bnrkwvu2zlb' }} />);
        expect(parameters).toMatchObject({ sharedId: 'bnrkwvu2zlb' });
      });
    });
  });
});
