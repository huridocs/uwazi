import React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import configureStore, { MockStore, MockStoreCreator } from 'redux-mock-store';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';
import Immutable from 'immutable';
import SettingsAPI from 'app/Settings/SettingsAPI';
import { RequestParams } from 'app/utils/RequestParams';
import { Settings } from 'shared/types/settingsType';

import { MultiSelect } from 'app/Forms';
import { CollectionSettings } from '../CollectionSettings';

const middlewares = [thunk];

describe('Collection settings', () => {
  let store: MockStore<object>;
  let component: ShallowWrapper<typeof CollectionSettings>;
  let saveAPIMock: jasmine.Spy;

  const mockStoreCreator: MockStoreCreator<object> = configureStore<object>(middlewares);

  beforeEach(() => {
    saveAPIMock = jasmine
      .createSpy('save')
      .and.returnValue(Promise.resolve({ savedSettings: true }));

    spyOn(SettingsAPI, 'save').and.callFake(saveAPIMock);
  });

  const render = (collectionSettings: Settings) => {
    store = mockStoreCreator({
      settings: { collection: Immutable.fromJS(collectionSettings) },
      templates: Immutable.fromJS([
        { name: 'template 1', _id: 'abc123' },
        { name: 'template 2', _id: 'def345' },
      ]),
    });
    component = shallow(
      <Provider store={store}>
        <CollectionSettings />
      </Provider>
    )
      .dive({ context: { store } })
      .dive();
  };

  describe('on submit', () => {
    it('should properly save the values', async () => {
      const formData = { home_page: 'custom home page', private: true };
      render(formData);
      await component.find('form').simulate('submit');
      expect(saveAPIMock).toHaveBeenCalledWith(new RequestParams(formData));
      expect(store.getActions()).toEqual(
        expect.arrayContaining([
          {
            type: 'settings/collection/SET',
            value: { savedSettings: true },
          },
        ])
      );
    });
  });

  describe('custom landing page', () => {
    const getHomePageToggleStatus = () =>
      component.find('SettingsFormElement[label="Use custom landing page"]').children().props()
        .toggled;

    it('should display the input when custom page is set', () => {
      render({ home_page: 'a-home' });
      expect(getHomePageToggleStatus()).toBe(true);
    });

    it('should hide input if custom landing page is empty', () => {
      render({});
      expect(getHomePageToggleStatus()).toBe(false);
    });
  });

  describe('allow public sharing', () => {
    const getPublicSharingStatus = () =>
      component.find('SettingsFormElement[label="Private instance"]').children().props().checked;

    it('should be toggled if instance is private', () => {
      render({ private: true });
      expect(getPublicSharingStatus()).toBe(true);
    });

    it('should be untoggled if instance is publicly shared', () => {
      render({ private: false });
      expect(getPublicSharingStatus()).toBe(false);
    });
  });

  describe('Public Endpoints', () => {
    const getPublicEndpointsStatus = () =>
      component.find('SettingsFormElement[label="Public Endpoints"]').children().props().toggled;

    it('should be toggled if templates or public form destination are set', () => {
      render({});
      expect(getPublicEndpointsStatus()).toBe(false);

      render({ allowedPublicTemplates: ['def345'] });
      expect(getPublicEndpointsStatus()).toBe(true);

      render({ publicFormDestination: '/anURL' });
      expect(getPublicEndpointsStatus()).toBe(true);
    });

    it('should display available templates', () => {
      render({});
      const multiselectProps = component.find(MultiSelect).props();
      expect(multiselectProps.options).toEqual([
        { label: 'template 1', value: 'abc123' },
        { label: 'template 2', value: 'def345' },
      ]);
    });

    it('should select checked whitelisted templates', () => {
      render({ allowedPublicTemplates: ['def345'] });
      const multiselectProps = component.find(MultiSelect).props();
      expect(multiselectProps.value).toEqual(['def345']);
    });
  });
});
