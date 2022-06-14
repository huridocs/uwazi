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
      spyOn(UsersAPI, 'currentUser').and.returnValue(Promise.resolve(user));
      spyOn(ThesauriAPI, 'getThesauri').and.returnValue(Promise.resolve(dictionaries));
      spyOn(ThesauriAPI, 'getModelStatus').and.returnValue(Promise.resolve(models));
      spyOn(I18NApi, 'get').and.returnValue(Promise.resolve(translations));
      spyOn(SettingsAPI, 'get').and.returnValue(Promise.resolve(settings));
      spyOn(TemplatesAPI, 'get').and.returnValue(Promise.resolve(templates));
      spyOn(api, 'search').and.returnValue(Promise.resolve(suggestions));
    });

    it('should get the current user, and metadata', async () => {
      const actions = await Settings.requestState(new RequestParams());
      expect(actions).toMatchSnapshot();
    });
  });
});
