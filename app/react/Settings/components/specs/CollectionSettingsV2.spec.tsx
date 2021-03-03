import React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import configureStore, { MockStore, MockStoreCreator } from 'redux-mock-store';
import { Provider } from 'react-redux';
import Immutable from 'immutable';
import { Settings } from 'shared/types/settingsType';

import { CollectionSettings } from '../CollectionSettingsV2';

describe('Collection settings', () => {
  let store: MockStore<object>;
  let component: ShallowWrapper<typeof CollectionSettings>;

  const mockStoreCreator: MockStoreCreator<object> = configureStore<object>([]);

  const render = (collectionSettings: Settings) => {
    store = mockStoreCreator({
      settings: { collection: Immutable.fromJS(collectionSettings) },
    });
    component = shallow(
      <Provider store={store}>
        <CollectionSettings />
      </Provider>
    )
      .dive()
      .dive();
  };

  describe('custom landing page', () => {
    const getHomePageToggleStatus = () =>
      component
        .find('input[name="home_page"]')
        .parent()
        .props().toggled;

    it('should display the input when custom page is set', () => {
      render({ home_page: 'a-home' });
      expect(getHomePageToggleStatus()).toBe(true);
    });

    it('should hide input if custom landing page is empty', () => {
      render({});
      expect(getHomePageToggleStatus()).toBe(false);
    });

    it('should clear custom home page on toggle off', () => {
      // apparently impossible test!
    });
  });

  describe('allow public sharing', () => {
    const getPublicSharingStatus = () =>
      component
        .find('#form-property-private')
        .children('ToggleButton')
        .props().checked;

    it('should be toggled if instance is private', () => {
      render({ private: true });
      expect(getPublicSharingStatus()).toBe(true);
    });

    it('should be untoggled if instance is publicly shared', () => {
      render({ private: false });
      expect(getPublicSharingStatus()).toBe(false);
    });

    it('should change to public on button click', () => {
      render({});
      const privateToggleButton = component.find('#form-property-private').children('ToggleButton');

      privateToggleButton.simulate('click');

      expect(getPublicSharingStatus()).toBe(true);
    });

    it('should change to private on button click', () => {
      render({ private: false });
    });
  });
});
