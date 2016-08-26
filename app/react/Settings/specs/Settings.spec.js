import {Settings} from '../Settings';
import UsersAPI from 'app/Users/UsersAPI';
import TemplatesAPI from 'app/Templates/TemplatesAPI';
import ThesaurisAPI from 'app/Thesauris/ThesaurisAPI';
import RelationTypesAPI from 'app/RelationTypes/RelationTypesAPI';

describe('Settings', () => {
  describe('requestState', () => {
    let user = {name: 'doe'};
    let templates = [{_id: 1, name: 'Decision'}];
    let thesauris = [{_id: 1, name: 'Countries'}];
    let relationTypes = [{_id: 1, name: 'Supports'}];

    beforeEach(() => {
      spyOn(UsersAPI, 'currentUser').and.returnValue(Promise.resolve(user));
      spyOn(TemplatesAPI, 'get').and.returnValue(Promise.resolve(templates));
      spyOn(ThesaurisAPI, 'getDictionaries').and.returnValue(Promise.resolve(thesauris));
      spyOn(RelationTypesAPI, 'get').and.returnValue(Promise.resolve(relationTypes));
    });

    it('should get the current user, and metadata', (done) => {
      Settings.requestState()
      .then((state) => {
        expect(state.user).toEqual(user);
        expect(state.templates).toEqual(templates);
        expect(state.dictionaries).toEqual(thesauris);
        expect(state.relationTypes).toEqual(relationTypes);
        done();
      });
    });
  });
});
