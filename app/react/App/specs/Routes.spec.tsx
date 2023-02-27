/**
 * @jest-environment jsdom
 */
import React from 'react';
import { getIndexElement } from 'app/getIndexElement';
import { Settings } from 'shared/types/settingsType';
import { Login } from 'app/Users/Login';
import { LibraryTable } from 'app/Library/LibraryTable';
import { PageView } from 'app/Pages/PageView';
import { ViewerRoute } from 'app/Viewer/ViewerRoute';

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

    describe('custom home page', () => {
      it('should return the sharedId for the page', () => {
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

      it('should render an entity view page when set', () => {
        settings.home_page = '/entity/entitySharedId';
        const { element, parameters } = getIndexElement(settings, undefined);
        expect(parameters).toBeUndefined();
        expect(element).toMatchObject(<ViewerRoute params={{ sharedId: 'entitySharedId' }} />);
      });

      it('should render a library view with the query', () => {});
    });

    describe('private instance', () => {
      beforeEach(() => {
        settings.private = true;
      });

      it('should go to login if there is not a user', () => {
        const { element, parameters } = getIndexElement(settings, undefined);
        expect(element).toMatchObject(<Login />);
        expect(parameters).toBeUndefined();
      });
    });

    describe('no logged in user', () => {
      it('should render the default library view', () => {
        const { element, parameters } = getIndexElement(settings, undefined);
        expect(element).toMatchObject(<LibraryTable />);
        expect(parameters).toBeUndefined();
      });
    });
  });
});
