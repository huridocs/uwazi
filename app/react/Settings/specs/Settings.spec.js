import UsersAPI from 'app/Users/UsersAPI';
import ThesaurisAPI from 'app/Thesauris/ThesaurisAPI';
import RelationTypesAPI from 'app/RelationTypes/RelationTypesAPI';
import { I18NApi } from 'app/I18N';
import { RequestParams } from 'app/utils/RequestParams';
import SettingsAPI from '../SettingsAPI';
import { Settings } from '../Settings';

describe('Settings', () => {
  describe('requestState', () => {
    const user = { name: 'doe' };
    const dictionaries = [{ _id: 1, name: 'Countries' }];
    const relationTypes = [{ _id: 1, name: 'Supports' }];
    const translations = [{ _id: 1, locale: 'es', values: {} }];
    const settings = { siteName: 'BatCave' };

    beforeEach(() => {
      spyOn(UsersAPI, 'currentUser').and.returnValue(Promise.resolve(user));
      spyOn(ThesaurisAPI, 'getDictionaries').and.returnValue(Promise.resolve(dictionaries));
      spyOn(RelationTypesAPI, 'get').and.returnValue(Promise.resolve(relationTypes));
      spyOn(I18NApi, 'get').and.returnValue(Promise.resolve(translations));
      spyOn(SettingsAPI, 'get').and.returnValue(Promise.resolve(settings));
    });

    it('should get the current user, and metadata', async () => {
      const actions = await Settings.requestState(new RequestParams());
      expect(actions).toMatchSnapshot();
    });
  });
});
