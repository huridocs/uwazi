import UsersAPI from 'app/Users/UsersAPI';
import ThesauriAPI from 'app/Thesauri/ThesauriAPI';
import { I18NApi } from 'app/I18N';
import { RequestParams } from 'app/utils/RequestParams';
import TemplatesAPI from 'app/Templates/TemplatesAPI';
import api from 'app/Search/SearchAPI';
import SettingsAPI from '../SettingsAPI';
import { Settings } from '../Settings';

describe('Settings', () => {
  describe('requestState', () => {
    const user = { name: 'doe' };
    const dictionaries = [{ _id: 1, name: 'Countries' }];
    const models = [];
    const translations = [{ _id: 1, locale: 'es', values: {} }];
    const templates = [];
    const settings = { siteName: 'BatCave' };
    const suggestions = {};

    beforeEach(() => {
      spyOn(UsersAPI, 'currentUser').and.callFake(async () => Promise.resolve(user));
      spyOn(ThesauriAPI, 'getThesauri').and.callFake(async () => Promise.resolve(dictionaries));
      spyOn(ThesauriAPI, 'getModelStatus').and.callFake(async () => Promise.resolve(models));
      spyOn(I18NApi, 'get').and.callFake(async () => Promise.resolve(translations));
      spyOn(SettingsAPI, 'get').and.callFake(async () => Promise.resolve(settings));
      spyOn(TemplatesAPI, 'get').and.callFake(async () => Promise.resolve(templates));
      spyOn(api, 'search').and.callFake(async () => Promise.resolve(suggestions));
    });

    it('should get the current user, and metadata', async () => {
      const actions = await Settings.requestState(new RequestParams());
      expect(actions).toMatchSnapshot();
    });
  });
});
