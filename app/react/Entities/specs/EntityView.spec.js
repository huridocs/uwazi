import EntityView from '../EntityView';
import EntitiesAPI from '../EntitiesAPI';
import TemplatesAPI from 'app/Templates/TemplatesAPI';
import ThesaurisAPI from 'app/Thesauris/ThesaurisAPI';

describe('EntityView', () => {
  describe('requestState', () => {
    let entities = [{_id: 1}];
    let templates = [{_id: 1, name: 'Decision'}];
    let thesauris = [{_id: 1, name: 'Countries'}];

    beforeEach(() => {
      spyOn(EntitiesAPI, 'get').and.returnValue(Promise.resolve(entities));
      spyOn(TemplatesAPI, 'get').and.returnValue(Promise.resolve(templates));
      spyOn(ThesaurisAPI, 'get').and.returnValue(Promise.resolve(thesauris));
    });

    it('should get the entity, templates, and thesauris', (done) => {
      EntityView.requestState({entityId: '123'})
      .then((state) => {
        expect(EntitiesAPI.get).toHaveBeenCalledWith('123');
        expect(state.entity).toEqual(entities[0]);
        expect(state.templates).toEqual(templates);
        expect(state.thesauris).toEqual(thesauris);
        done();
      });
    });
  });
});
