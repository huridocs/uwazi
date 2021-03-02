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

    it('should show the input on toggle on', () => {
      render({});
      const toggleHomePageOn = component
        .find('input[name="home_page"]')
        .parent()
        .props().onToggleOn;
      toggleHomePageOn();
      expect(getHomePageToggleStatus()).toBe(true);
    });

    fit('should clear custom home page on toggle off', () => {
      render({ home_page: 'to-be-removed' });
      const toggleHomePageOff = component
        .find('input[name="home_page"]')
        .parent()
        .props().onToggleOff;

      toggleHomePageOff();

      component.find('form').simulate('submit');

      console.log(store.getActions());
      // console.log(getHomePageToggleStatus());
    });
  });
});
