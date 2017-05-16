import {Settings} from '../Settings';
import UsersAPI from 'app/Users/UsersAPI';
import SettingsAPI from '../SettingsAPI';
import ThesaurisAPI from 'app/Thesauris/ThesaurisAPI';
import RelationTypesAPI from 'app/RelationTypes/RelationTypesAPI';
import {I18NApi} from 'app/I18N';

describe('Settings', () => {
  describe('requestState', () => {
    let user = {name: 'doe'};
    let dictionaries = [{_id: 1, name: 'Countries'}];
    let relationTypes = [{_id: 1, name: 'Supports'}];
    let translations = [{_id: 1, locale: 'es', values: {}}];
    let settings = {siteName: 'BatCave'};

    beforeEach(() => {
      spyOn(UsersAPI, 'currentUser').and.returnValue(Promise.resolve(user));
      spyOn(ThesaurisAPI, 'getDictionaries').and.returnValue(Promise.resolve(dictionaries));
      spyOn(RelationTypesAPI, 'get').and.returnValue(Promise.resolve(relationTypes));
      spyOn(I18NApi, 'get').and.returnValue(Promise.resolve(translations));
      spyOn(SettingsAPI, 'get').and.returnValue(Promise.resolve(settings));
    });

    it('should get the current user, and metadata', (done) => {
      Settings.requestState()
      .then((state) => {
        expect(state.user).toEqual(user);
        expect(state.dictionaries).toEqual(dictionaries);
        expect(state.translations).toEqual(translations);
        expect(state.settings.collection).toEqual(settings);
        done();
      });
    });
  });
});
