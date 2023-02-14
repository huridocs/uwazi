import React from 'react';
import { shallow } from 'enzyme';
import UsersAPI from 'app/Users/UsersAPI';
import ThesauriAPI from 'app/Thesauri/ThesauriAPI';
import { I18NApi } from 'app/I18N';
import { RequestParams } from 'app/utils/RequestParams';
import TemplatesAPI from 'app/Templates/TemplatesAPI';
import api from 'app/Search/SearchAPI';
import SettingsAPI from '../SettingsAPI';
import { SettingsComponent as Settings } from '../Settings';

describe('Settings', () => {
  let user;
  const dictionaries = [{ _id: 1, name: 'Countries' }];
  const models = [];
  const translations = [{ _id: 1, locale: 'es', values: {} }];
  const templates = [];
  const settings = { siteName: 'BatCave' };
  const suggestions = {};

  beforeEach(() => {
    user = { name: 'doe', role: 'admin' };
    spyOn(UsersAPI, 'currentUser').and.callFake(async () => Promise.resolve(user));
    spyOn(ThesauriAPI, 'getThesauri').and.callFake(async () => Promise.resolve(dictionaries));
    spyOn(ThesauriAPI, 'getModelStatus').and.callFake(async () => Promise.resolve(models));
    spyOn(I18NApi, 'get').and.callFake(async () => Promise.resolve(translations));
    spyOn(SettingsAPI, 'get').and.callFake(async () => Promise.resolve(settings));
    spyOn(SettingsAPI, 'stats').and.callFake(async () => Promise.resolve({ files: 3, users: 2 }));
    spyOn(TemplatesAPI, 'get').and.callFake(async () => Promise.resolve(templates));
    spyOn(api, 'search').and.callFake(async () => Promise.resolve(suggestions));
  });

  describe('requestState', () => {
    it('should get the current user, and metadata', async () => {
      const actions = await Settings.requestState(new RequestParams());
      expect(actions).toMatchSnapshot();
    });

    it('should not request the stats if the user does not have admin role', async () => {
      user = { name: 'jane', role: 'editor' };
      const actions = await Settings.requestState(new RequestParams());
      expect(actions).toMatchSnapshot();
    });
  });

  describe('render', () => {
    let component;
    const render = children => {
      const context = { store: { getState: () => ({}), dispatch: jasmine.createSpy('dispatch') } };
      component = shallow(<Settings>{children}</Settings>, { context });
    };

    it('should add the only-desktop class when recieving children only', () => {
      render('Account settings');
      expect(component).toMatchSnapshot();

      render();
      expect(component).toMatchSnapshot();
    });
  });
});
